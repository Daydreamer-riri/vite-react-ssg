import React from 'react'
import { createRoot as ReactDOMCreateRoot, hydrateRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { RouterProvider, createBrowserRouter, matchRoutes } from 'react-router-dom'
import type { RouterOptions, ViteReactSSGClientOptions, ViteReactSSGContext } from '../types'
import { documentReady } from '../utils/document-ready'
import { deserializeState } from '../utils/state'
import SiteMetadataDefaults from './components/SiteMetadataDefaults'

export * from '../types'

export function ViteReactSSG(
  routerOptions: RouterOptions,
  fn?: (context: ViteReactSSGContext<true>) => Promise<void> | void,
  options: ViteReactSSGClientOptions = {},
) {
  const {
    transformState,
    rootContainer = '#root',
    ssrWhenDev = true,
    getStyleCollector = null,
  } = options

  const isClient = typeof window !== 'undefined'

  async function createRoot(client = false, routePath?: string) {
    const browserRouter = client ? createBrowserRouter(routerOptions.routes) : undefined

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
      getStyleCollector,
    }

    if (client) {
      await documentReady()
      // @ts-expect-error global variable
      context.initialState = transformState?.(window.__INITIAL_STATE__ || {}) || deserializeState(window.__INITIAL_STATE__)
    }

    await fn?.(context)

    if (!client) {
      const route = context.routePath ?? '/'
      context.initialState = {} // TODO:
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
        ? document.querySelector(rootContainer)!
        : rootContainer
      const { router } = await createRoot(true)
      const app = (
        <HelmetProvider>
          <SiteMetadataDefaults />
          <RouterProvider router={router!} />
        </HelmetProvider>
      )
      if (!ssrWhenDev && import.meta.env.DEV) {
        const root = ReactDOMCreateRoot(container)
        React.startTransition(() => {
          root.render(app)
        })
      }
      else {
        const lazeMatches = matchRoutes(routerOptions.routes, window.location)?.filter(
          m => m.route.lazy,
        )

        // Load the lazy matches and update the routes before creating your router
        // so we can hydrate the SSR-rendered content synchronously
        if (lazeMatches && lazeMatches?.length > 0) {
          await Promise.all(
            lazeMatches.map(async (m) => {
              const routeModule = await m.route.lazy!()
              Object.assign(m.route, { ...routeModule, lazy: undefined })
            }),
          )
        }
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
