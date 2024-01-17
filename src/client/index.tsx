import React from 'react'
import { createRoot as ReactDOMCreateRoot, hydrateRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { RouterProvider, createBrowserRouter, matchRoutes } from 'react-router-dom'
import type { RouterOptions, ViteReactSSGClientOptions, ViteReactSSGContext } from '../types'
import { documentReady } from '../utils/document-ready'
import { deserializeState } from '../utils/state'

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

  async function createRoot(client = false, routePath?: string) {
    const browserRouter = client ? createBrowserRouter(routerOptions.routes, { basename: BASE_URL }) : undefined

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
          <RouterProvider router={router!} />
        </HelmetProvider>
      )
      const isSSR = document.querySelector('[data-server-rendered=true]') !== null
      if (!isSSR && process.env.NODE_ENV === 'development') {
        const root = ReactDOMCreateRoot(container)
        React.startTransition(() => {
          root.render(app)
        })
      }
      else {
        React.startTransition(() => {
          hydrateRoot(container, app)
        })
      }
    })()
  }

  return createRoot
}

export { default as Head } from './components/Head'
export { default as ClientOnly } from './components/ClientOnly'
export { Link, NavLink } from './components/Link'
