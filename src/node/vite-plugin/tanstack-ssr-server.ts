import type { Connect, ModuleNode } from 'vite'
import { send } from 'vite'
import type { LoaderFnContext } from '@tanstack/react-router'
import { renderTanstack } from '../server'
import { createLink, renderHTML } from '../html'
import { joinUrlSegments } from '../../utils/path'
import type { ViteReactSSGContext } from '../../client/tanstack'
import { fromNodeRequest, json, stripDataParam, toNodeRequest } from '../../pollfill/node-adapter'
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
    const { router, getStyleCollector } = appCtx
    const url = req.originalUrl!
    const searchParams = new URLSearchParams(url.split('?')[1])
    if (searchParams.has('_data')) {
      const routeId = decodeURIComponent(searchParams.get('_data')!)
      const request = stripDataParam(fromNodeRequest(req))
      const url = new URL(request.url)

      const matches = appCtx.router.matchRoutes(url.pathname, Object.fromEntries(searchParams.entries()))
      const _match = matches.find(m => m.routeId === routeId)
      const matchRoute = router.flatRoutes.find(item => {
        const matchRouteId = _match?.routeId === '__root__' ? '/' : _match?.routeId
        return item.id === matchRouteId
      })

      if (!matchRoute) {
        res.statusCode = 404
        res.end(`Route not found: ${routeId}`)
        return
      }
      const getLoaderContext = (): LoaderFnContext => {
        const {
          params,
          loaderDeps,
          abortController,
          context,
          cause,
        } = _match!

        const search = router.options.parseSearch(url.search)
        const searchStr = router.options.stringifySearch(search)
        return {
          preload: false,
          navigate: async () => {},
          params,
          deps: loaderDeps,
          abortController,
          context,
          location: {
            ...url,
            search,
            searchStr,
            state: {},
          },
          cause,
          route: matchRoute,
        }
      }

      const loaderData = await matchRoute.options.loader?.(getLoaderContext())
      if (!loaderData) {
        res.statusCode = 200
        res.end(`There is no loader for the route: ${routeId}`)
        return
      }
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
