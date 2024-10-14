import type { Connect, ModuleNode } from 'vite'
import { send } from 'vite'
import type { LoaderFunction, LoaderFunctionArgs } from 'react-router-dom'
import { render } from '../server'
import { fromNodeRequest, stripDataParam, toNodeRequest } from '../../pollfill/node-adapter'
import { createLink, renderHTML } from '../html'
import { joinUrlSegments } from '../../utils/path'
import { convertRoutesToDataRoutes } from '../../utils/remix-router'
import type { ViteReactSSGContext } from '../../types'
import type { HandlerCreaterOptions } from '.'

export function createRemixSSRHandler({
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
    const { matchRoutes } = await import('react-router-dom')
    const { app, routes, base, getStyleCollector } = appCtx
    const url = req.originalUrl!
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
        loader: loader as LoaderFunction,
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

    const { appHTML, bodyAttributes, htmlAttributes, metaAttributes, styleTag }
                    = await render(app ?? [...routes], fromNodeRequest(req), styleCollector, base)

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

export async function callRouteLoader({
  // loadContext,
  loader,
  params,
  request,
  routeId,
}: {
  request: Request
  loader: LoaderFunction
  params: LoaderFunctionArgs['params']
  routeId: string
}) {
  const { json } = await import('react-router-dom')
  const result = await loader({
    request: stripDataParam(stripIndexParam(request)),
    params,
  })

  if (result === undefined) {
    throw new Error(
      `You defined a loader for route "${routeId}" but didn't return `
      + `anything from your \`loader\` function. Please return a value or \`null\`.`,
    )
  }

  return isResponse(result) ? result : json(result)
}

function isResponse(value: any): value is Response {
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
