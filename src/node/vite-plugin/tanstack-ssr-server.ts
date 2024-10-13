import type { Connect, ModuleNode } from 'vite'
import { send } from 'vite'
import { renderTanstack } from '../server'
import { createLink, renderHTML } from '../html'
import { joinUrlSegments } from '../../utils/path'
import type { ViteReactSSGContext } from '../../client/tanstack'
import { fromNodeRequest, json, toNodeRequest } from '../../pollfill/node-adapter'
import type { HandlerCreaterOptions } from '.'

export function createTanstackSSRHandler({
  template,
  ssrEntry,
  onBeforePageRender,
  entry,
  rootContainerId,
  onPageRendered,
  server,
  ssgContext: appCtx,
}: HandlerCreaterOptions<ViteReactSSGContext>): Connect.NextHandleFunction {
  return async (req, res, _next) => {
    // dynamic import
    const { router, routes, base, getStyleCollector } = appCtx
    const url = req.originalUrl!
    const searchParams = new URLSearchParams(url.split('?')[1])
    if (searchParams.has('_data')) {
      // const {MatchRoute} = await import('@tanstack/react-router')
      const request = fromNodeRequest(req)
      const url = new URL(request.url)
      const routeId = decodeURIComponent(searchParams.get('_data')!)

      const matches = appCtx.router.matchRoutes(url.pathname, Object.fromEntries(searchParams.entries()))
      //   const matches = matchRoutes(
      //     convertRoutesToDataRoutes([...routes], route => route),
      //     {
      //       pathname: url.pathname,
      //       search: url.search,
      //       hash: url.hash,
      //       state: null,
      //       key: 'default',
      //     },
      //     base,
      //   )
      const match = matches.find(m => m.routeId === routeId)
      if (!match) {
        res.statusCode = 404
        res.end(`Route not found: ${routeId}`)
        return
      }
      //   if (!match) {
      //     res.statusCode = 404
      //     res.end(`Route not found: ${routeId}`)
      //     return
      //   }
      const { createMemoryHistory } = await import('@tanstack/react-router')
      const memoryHistory = createMemoryHistory({
        initialEntries: [req.originalUrl!],
      })

      router.update({
        history: memoryHistory,
      })

      await router.load()
      const { loaderData } = match
      if (!loaderData) {
        res.statusCode = 200
        res.end(`There is no loader for the route: ${routeId}`)
        return
      }
      //   const loader = match.route.loader ?? await match.route.lazy?.().then(m => m.loader)
      //   if (!loader) {
      //     res.statusCode = 200
      //     res.end(`There is no loader for the route: ${routeId}`)
      //     return
      //   }
      //   const response = await callRouteLoader({
      //     loader: loader as LoaderFunction,
      //     params: match.params,
      //     request,
      //     routeId,
      //   })
      await toNodeRequest(json(loaderData), res)
      return
    }

    const indexHTML = await server.transformIndexHtml(url, template)
    const transformedIndexHTML = (await onBeforePageRender?.(url, indexHTML, appCtx)) || indexHTML

    const styleCollector = getStyleCollector ? await getStyleCollector() : null

    const { appHTML, bodyAttributes, htmlAttributes, metaAttributes, styleTag }
                    = await renderTanstack(appCtx.router, url, styleCollector)

    metaAttributes.push(styleTag)

    const mods = await Promise.all(
      [ssrEntry, entry].map(async entry => await server.moduleGraph.getModuleByUrl(entry)),
    )

    const assetsUrls = new Set<string>()

    const collectAssets = async (mod: ModuleNode | undefined) => {
      if (!mod || !mod?.ssrTransformResult)
        return

      const { deps = [], dynamicDeps = [] } = mod?.ssrTransformResult
      const allDeps = [...deps, ...dynamicDeps]
      for (const dep of allDeps) {
        if (
          dep.endsWith('.css')
          || dep.endsWith('.scss')
          || dep.endsWith('.sass')
          || dep.endsWith('.less')
        ) {
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
}

// export function ssrServerPlugin({
//   template,
//   ssrEntry,
//   onBeforePageRender,
//   entry,
//   rootContainerId,
//   onPageRendered,
// }: Options): PluginOption {
//   return {
//     name: 'vite-react-ssg:dev-server-remix',
//     configureServer(server) {
//       const renderMiddleware: Connect.NextHandleFunction = async (req, res, _next) => {
//         try {
//           const url = req.originalUrl!
//
//           const createRoot: CreateRootFactory = await server.ssrLoadModule(ssrEntry).then(m => m.createRoot)
//           const appCtx = await createRoot(false, url) as ViteReactSSGContext<true>
//           const { routes, getStyleCollector, base, app } = appCtx
//         }
//         catch (e: any) {
//           server.ssrFixStacktrace(e)
//           console.error(`[vite-react-ssg] error: ${e.stack}`)
//           res.statusCode = 500
//           res.end(e.stack)
//         }
//       }
//
//       return () => {
//         server.middlewares.use(renderMiddleware)
//       }
//     },
//   }
// }

// export async function callRouteLoader({
//   // loadContext,
//   loader,
//   params,
//   request,
//   routeId,
//   // singleFetch,
//   // response,
// }: {
//   request: Request
//   loader: LoaderFunction
//   params: LoaderFunctionArgs['params']
//   // loadContext: AppLoadContext
//   routeId: string
//   // singleFetch: boolean
//   // response?: ResponseStub
// }) {
//   const { json } = await import('react-router-dom')
//   const result = await loader({
//     request: stripDataParam(stripIndexParam(request)),
//     // context: loadContext,
//     params,
//     // Only provided when single fetch is enabled, and made available via
//     // `defineLoader` types, not `LoaderFunctionArgs`
//     // ...(singleFetch ? { response } : null),
//   })
//
//   if (result === undefined) {
//     throw new Error(
//       `You defined a loader for route "${routeId}" but didn't return `
//       + `anything from your \`loader\` function. Please return a value or \`null\`.`,
//     )
//   }
//
//   // Allow naked object returns when single fetch is enabled
//   // if (singleFetch) {
//   //   return result
//   // }
//
//   return isResponse(result) ? result : json(result)
// }
//
// function isResponse(value: any): value is Response {
//   return (
//     value != null
//     && typeof value.status === 'number'
//     && typeof value.statusText === 'string'
//     && typeof value.headers === 'object'
//     && typeof value.body !== 'undefined'
//   )
// }
//
// function stripIndexParam(request: Request) {
//   const url = new URL(request.url)
//   const indexValues = url.searchParams.getAll('index')
//   url.searchParams.delete('index')
//   const indexValuesToKeep = []
//   for (const indexValue of indexValues) {
//     if (indexValue) {
//       indexValuesToKeep.push(indexValue)
//     }
//   }
//   for (const toKeep of indexValuesToKeep) {
//     url.searchParams.append('index', toKeep)
//   }
//
//   const init: RequestInit = {
//     method: request.method,
//     body: request.body,
//     headers: request.headers,
//     signal: request.signal,
//   }
//
//   if (init.body) {
//     (init as { duplex: 'half' }).duplex = 'half'
//   }
//
//   return new Request(url.href, init)
// }
//
// function stripDataParam(request: Request) {
//   const url = new URL(request.url)
//   url.searchParams.delete('_data')
//   const init: RequestInit = {
//     method: request.method,
//     body: request.body,
//     headers: request.headers,
//     signal: request.signal,
//   }
//
//   if (init.body) {
//     (init as { duplex: 'half' }).duplex = 'half'
//   }
//
//   return new Request(url.href, init)
// }
