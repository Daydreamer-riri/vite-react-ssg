import React from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { RouterProvider, createBrowserRouter, matchRoutes } from 'react-router-dom'
import { hydrate, render } from '../pollfill/react-helper'
import type { RouteRecord, RouterOptions, ViteReactSSGClientOptions, ViteReactSSGContext } from '../types'
import { documentReady } from '../utils/document-ready'
import { deserializeState } from '../utils/state'
import { joinUrlSegments, stripBase, withLeadingSlash } from '../utils/path'
import { convertRoutesToDataRoutes } from '../utils/remix-router'

export * from '../types'

export function ViteReactSSG(
  routerOptions: RouterOptions,
  fn?: (context: ViteReactSSGContext<true>) => Promise<void> | void,
  options: ViteReactSSGClientOptions = {},
) {
  const {
    transformState,
    rootContainer = '#root',
    ssrWhenDev,
    getStyleCollector = null,
  } = options

  if (process.env.NODE_ENV === 'development' && ssrWhenDev !== undefined)
    console.warn('[vite-react-ssg] `ssrWhenDev` option is no longer needed. If you want to use csr, just replace `vite-react-ssg dev` with `vite`.')

  const isClient = typeof window !== 'undefined'

  const BASE_URL = routerOptions.basename ?? '/'
  const { v7_startTransition, ...routerFeature } = routerOptions.future ?? {}

  async function createRoot(client = false, routePath?: string) {
    const browserRouter = client
      ? createBrowserRouter(
        convertRoutesToDataRoutes(routerOptions.routes, transformStaticLoaderRoute),
        { basename: BASE_URL, future: routerFeature },
      )
      : undefined

    const appRenderCallbacks: Function[] = []
    const onSSRAppRendered = client
      ? () => {}
      : (cb: Function) => appRenderCallbacks.push(cb)
    const triggerOnSSRAppRendered = () => {
      return Promise.all(appRenderCallbacks.map(cb => cb()))
    }
    const context: ViteReactSSGContext<true> = {
      isClient,
      routes: routerOptions.routes,
      router: browserRouter,
      routerOptions,
      onSSRAppRendered,
      triggerOnSSRAppRendered,
      initialState: {},
      transformState,
      routePath,
      base: BASE_URL,
      getStyleCollector,
      routerType: 'remix',
    }

    if (client) {
      await documentReady()
      // @ts-expect-error global variable
      context.initialState = transformState?.(window.__INITIAL_STATE__ || {}) || deserializeState(window.__INITIAL_STATE__)
    }

    await fn?.(context)

    if (!client) {
      // const route = context.routePath ?? '/'
      // context.initialState = {} // TODO:
    }

    const initialState = context.initialState

    return {
      ...context,
      initialState,
    } as ViteReactSSGContext<true>
  }

  if (isClient) {
    (async () => {
      const container = typeof rootContainer === 'string'
        ? document.querySelector(rootContainer)
        : rootContainer

      if (!container) {
        // @ts-expect-error global variable
        if (typeof $jsdom === 'undefined')
          console.warn('[vite-react-ssg] Root container not found.')
        return
      }

      const lazeMatches = matchRoutes(routerOptions.routes, window.location, BASE_URL)?.filter(
        m => m.route.lazy,
      )

      // Load the lazy matches and update the routes before creating your router
      // so we can hydrate the SSR-rendered content synchronously
      if (lazeMatches && lazeMatches?.length > 0) {
        await Promise.all(
          lazeMatches.map(async m => {
            const routeModule = await m.route.lazy!()
            Object.assign(m.route, { ...routeModule, lazy: undefined })
          }),
        )
      }

      const { router } = await createRoot(true)
      const app = (
        <HelmetProvider>
          <RouterProvider router={router!} future={{ v7_startTransition }} />
        </HelmetProvider>
      )
      const isSSR = document.querySelector('[data-server-rendered=true]') !== null
      if (!isSSR && process.env.NODE_ENV === 'development') {
        render(app, container, options)
      }
      else {
        hydrate(app, container, options)
      }
    })()
  }

  return createRoot

  function transformStaticLoaderRoute(route: RouteRecord) {
    const isSSR = document.querySelector('[data-server-rendered=true]') !== null
    if (!isSSR) {
      return route
    }
    const loader: RouteRecord['loader'] = async ({ request }) => {
      if (process.env.NODE_ENV === 'development') {
        const routeId = encodeURIComponent(route.id!)
        const dataQuery = `_data=${routeId}`
        const url = request.url.includes('?') ? `${request.url}&${dataQuery}` : `${request.url}?${dataQuery}`
        return fetch(url)
      }
      else {
        let staticLoadData: any
        if (window.__VITE_REACT_SSG_STATIC_LOADER_DATA__) {
          staticLoadData = window.__VITE_REACT_SSG_STATIC_LOADER_DATA__
        }
        else {
          const manifestUrl = joinUrlSegments(BASE_URL, `static-loader-data-manifest-${window.__VITE_REACT_SSG_HASH__}.json`)
          staticLoadData = await (await fetch(withLeadingSlash(manifestUrl))).json()
          window.__VITE_REACT_SSG_STATIC_LOADER_DATA__ = staticLoadData
        }

        const { url } = request
        let { pathname } = new URL(url)
        if (BASE_URL !== '/') {
          pathname = stripBase(pathname, BASE_URL)
        }
        const routeData = staticLoadData?.[pathname]?.[route.id!]
        return routeData ?? null
      }
    }
    route.loader = loader
    return route
  }
}

declare global {
  interface Window {
    __VITE_REACT_SSG_STATIC_LOADER_DATA__: any
    __VITE_REACT_SSG_HASH__: string
  }
}

export { default as Head } from './components/Head'
export { default as ClientOnly } from './components/ClientOnly'
export { Link, NavLink } from './components/Link'
