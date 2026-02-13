// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck
import type { LoaderFnContext } from '@tanstack/react-router'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { FilledContext } from 'react-helmet-async'
import type { Connect } from 'vite'
import type { IRouterAdapter, RenderResult } from './interface'
import type { ViteReactSSGContext } from '~/client/tanstack'
import { JSDOM } from 'jsdom'
import { HelmetProvider } from 'react-helmet-async'
import { fromNodeRequest, json, toNodeRequest } from '~/pollfill/node-adapter'
import { removeLeadingSlash, withTrailingSlash } from '~/utils/path'
import { META_CONTAINER_ID } from '~/utils/tanstack-router'
import { renderStaticApp } from '../serverRenderer'
import { extractHelmet } from './utils'

export class TanstackAdapter implements IRouterAdapter<ViteReactSSGContext> {
  context: ViteReactSSGContext
  constructor(context: ViteReactSSGContext) {
    this.context = context
  }

  render: (path: string) => Promise<RenderResult> = async path => {
    const { getStyleCollector, router: _router, base } = this.context
    const styleCollector = getStyleCollector ? await getStyleCollector() : null
    path = `${withTrailingSlash(base)}${removeLeadingSlash(path)}`
    const { createRouter, createMemoryHistory } = await import('@tanstack/react-router')
    const router = createRouter(_router.options)
    const { StartServer } = await import('@tanstack/start/server')
    const memoryHistory = createMemoryHistory({
      initialEntries: [path],
    })

    router.update({
      history: memoryHistory,
    })

    await router.load()
    const helmetContext = {} as FilledContext
    let app = (
      <HelmetProvider context={helmetContext}>
        <StartServer router={router} />
      </HelmetProvider>
    )

    const matchRoutes = router.matchRoutes(router.latestLocation)
    const routerContext = {
      loaderData: matchRoutes.map(item => ({ id: item.routeId, loaderData: item.loaderData })),
    }
    if (styleCollector)
      app = styleCollector.collect(app)

    const appHTML = await renderStaticApp(app)
    const jsdom = new JSDOM(appHTML)
    const headElements = jsdom.window.document.querySelector(`#${META_CONTAINER_ID}`)

    const { htmlAttributes, bodyAttributes, metaAttributes, styleTag } = extractHelmet(appHTML, helmetContext, styleCollector)
    if (headElements?.innerHTML) {
      metaAttributes.unshift(headElements.innerHTML)
      headElements.innerHTML = ''
    }

    return {
      appHTML: jsdom.window.document.body.innerHTML,
      htmlAttributes,
      bodyAttributes,
      metaAttributes,
      styleTag,
      routerContext,
    }
  }

  handleLoader: (req: Connect.IncomingMessage, res: ServerResponse<IncomingMessage>) => void = async (req, res) => {
    const request = fromNodeRequest(req)
    const url = new URL(request.url)
    const routeId = decodeURIComponent(url.searchParams.get('_data')!)
    const { router } = this.context

    const matches = router.matchRoutes(url.pathname, Object.fromEntries(url.searchParams.entries()))
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
        index,
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
          state: { __TSR_index: index },
        },
        cause,
        route: matchRoute,
        parentMatchPromise: null as any,
      }
    }

    const loaderData = await matchRoute.options.loader?.(getLoaderContext())
    if (!loaderData) {
      res.statusCode = 200
      res.end(`There is no loader for the route: ${routeId}`)
      return
    }
    await toNodeRequest(json(loaderData), res)
  }
}
