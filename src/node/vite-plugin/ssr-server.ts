import type { Connect, ModuleNode, PluginOption } from 'vite'
import { send } from 'vite'
import type { LoaderFunction, LoaderFunctionArgs } from 'react-router-dom'
import { json, matchRoutes } from 'react-router-dom'
import type { CreateRootFactory } from '../build'
import type { RouteRecord, ViteReactSSGContext, ViteReactSSGOptions } from '../../types'
import { render } from '../server'
import { fromNodeRequest, toNodeRequest } from '../../pollfill/node-adapter'
import { createLink, renderHTML } from '../html'
import { joinUrlSegments } from '../../utils/path'
import { convertRoutesToDataRoutes } from '../../utils/remix-router'

interface Options extends ViteReactSSGOptions {
  template: string
  ssrEntry: string
  entry: string
  rootContainerId: string
}

export function ssrServerPlugin({
  template,
  ssrEntry,
  onBeforePageRender,
  entry,
  rootContainerId,
  onPageRendered,
}: Options): PluginOption {
  return {
    name: 'vite-react-ssg:dev-server-remix',
    configureServer(server) {
      const renderMiddleware: Connect.NextHandleFunction = async (req, res, _next) => {
        try {
          const url = req.originalUrl!

          const createRoot: CreateRootFactory = await server.ssrLoadModule(ssrEntry).then(m => m.createRoot)
          const appCtx = await createRoot(false, url) as ViteReactSSGContext<true>
          const { routes, getStyleCollector, base, app } = appCtx

          const searchParams = new URLSearchParams(url.split('?')[1])
          if (!app && searchParams.has('_data')) {
            const request = fromNodeRequest(req)
            const url = new URL(request.url)
            const routeId = decodeURIComponent(searchParams.get('_data')!)
            const matches = matchRoutes(
              convertRoutesToDataRoutes([...routes], route => route),
              {
                pathname: url.pathname,
                search: url.search,
                hash: url.hash,
                state: null,
                key: 'default',
              },
              base,
            )
            if (!matches) {
              res.statusCode = 404
              res.end(`Route not found: ${routeId}`)
              return
            }
            const match = matches.find(m => m.route.id === routeId)
            if (!match) {
              res.statusCode = 404
              res.end(`Route not found: ${routeId}`)
              return
            }
            const loader = match.route.loader ?? await match.route.lazy?.().then(m => m.loader)
            if (!loader) {
              res.statusCode = 200
              res.end(`There is no loader for the route: ${routeId}`)
              return
            }
            const response = await callRouteLoader({
              loader,
              params: match.params,
              request,
              routeId,
            })
            await toNodeRequest(response, res)
            return
          }

          const indexHTML = await server.transformIndexHtml(url, template)
          const transformedIndexHTML = (await onBeforePageRender?.(url, indexHTML, appCtx)) || indexHTML

          const styleCollector = getStyleCollector ? await getStyleCollector() : null

          const { appHTML, bodyAttributes, htmlAttributes, metaAttributes, styleTag, routerContext }
                    = await render(app ?? [...routes], fromNodeRequest(req), styleCollector, base)

          metaAttributes.push(styleTag)

          const matchesEntries = routerContext?.matches
            .map(match => (match.route as RouteRecord).entry as string)
            .filter(entry => !!entry)
            .map(entry => entry[0] === '/' ? entry : `/${entry}`) ?? []
          const mods = await Promise.all(
            [ssrEntry, entry, ...matchesEntries].map(async entry => await server.moduleGraph.getModuleByUrl(entry)),
          )

          const assetsUrls = new Set<string>()

          const collectAssets = async (mod: ModuleNode | undefined) => {
            if (!mod || !mod?.ssrTransformResult)
              return

            const { deps = [], dynamicDeps = [] } = mod?.ssrTransformResult
            const allDeps = [...deps, ...dynamicDeps]
            for (const dep of allDeps) {
              if (dep.endsWith('.css')) {
                assetsUrls.add(dep)
              }
              else if (dep.endsWith('.ts') || dep.endsWith('.tsx')) {
                const depModule = await server.moduleGraph.getModuleByUrl(dep)
                depModule && await collectAssets(depModule)
              }
            }
          }
          await Promise.all(mods.map(async mod => collectAssets(mod)))
          const preloadLink = [...assetsUrls].map(item => createLink(joinUrlSegments(server.config.base, item)))
          metaAttributes.push(...preloadLink)

          const renderedHTML = await renderHTML({
            rootContainerId,
            appHTML,
            indexHTML: transformedIndexHTML,
            metaAttributes,
            bodyAttributes,
            htmlAttributes,
            initialState: null,
          })

          const transformed = await onPageRendered?.(url, renderedHTML, appCtx) || renderedHTML

          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          const isDev: boolean = 'pluginContainer' in server
          const headers = isDev
            ? server.config.server.headers
            : server.config.preview.headers
          send(req, res, transformed, 'html', { headers })
        }
        catch (e: any) {
          server.ssrFixStacktrace(e)
          console.error(`[vite-react-ssg] error: ${e.stack}`)
          res.statusCode = 500
          res.end(e.stack)
        }
      }

      return () => {
        server.middlewares.use(renderMiddleware)
      }
    },
  }
}

export async function callRouteLoader({
  // loadContext,
  loader,
  params,
  request,
  routeId,
  // singleFetch,
  // response,
}: {
  request: Request
  loader: LoaderFunction
  params: LoaderFunctionArgs['params']
  // loadContext: AppLoadContext
  routeId: string
  // singleFetch: boolean
  // response?: ResponseStub
}) {
  const result = await loader({
    request: stripDataParam(stripIndexParam(request)),
    // context: loadContext,
    params,
    // Only provided when single fetch is enabled, and made available via
    // `defineLoader` types, not `LoaderFunctionArgs`
    // ...(singleFetch ? { response } : null),
  })

  if (result === undefined) {
    throw new Error(
      `You defined a loader for route "${routeId}" but didn't return `
      + `anything from your \`loader\` function. Please return a value or \`null\`.`,
    )
  }

  // Allow naked object returns when single fetch is enabled
  // if (singleFetch) {
  //   return result
  // }

  return isResponse(result) ? result : json(result)
}

export function isResponse(value: any): value is Response {
  return (
    value != null
    && typeof value.status === 'number'
    && typeof value.statusText === 'string'
    && typeof value.headers === 'object'
    && typeof value.body !== 'undefined'
  )
}

function stripIndexParam(request: Request) {
  const url = new URL(request.url)
  const indexValues = url.searchParams.getAll('index')
  url.searchParams.delete('index')
  const indexValuesToKeep = []
  for (const indexValue of indexValues) {
    if (indexValue) {
      indexValuesToKeep.push(indexValue)
    }
  }
  for (const toKeep of indexValuesToKeep) {
    url.searchParams.append('index', toKeep)
  }

  const init: RequestInit = {
    method: request.method,
    body: request.body,
    headers: request.headers,
    signal: request.signal,
  }

  if (init.body) {
    (init as { duplex: 'half' }).duplex = 'half'
  }

  return new Request(url.href, init)
}

function stripDataParam(request: Request) {
  const url = new URL(request.url)
  url.searchParams.delete('_data')
  const init: RequestInit = {
    method: request.method,
    body: request.body,
    headers: request.headers,
    signal: request.signal,
  }

  if (init.body) {
    (init as { duplex: 'half' }).duplex = 'half'
  }

  return new Request(url.href, init)
}
