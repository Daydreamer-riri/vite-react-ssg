import React from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import type { RouterOptions, ViteReactSSGClientOptions, ViteReactSSGContext } from '../types'
import { documentReady } from '../utils/document-ready'
import { deserializeState } from '../utils/state'
import SiteMetadataDefaults from './components/SiteMetadataDefaults'

export * from '../types'

export function ViteReactSSG(
  // App: ReactNode,
  routerOptions: RouterOptions,
  fn?: (context: ViteReactSSGContext<true>) => Promise<void> | void,
  options: ViteReactSSGClientOptions = {},
) {
  const {
    transformState,
    rootContainer = '#root',
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
      // app: App,
      isClient,
      routes: routerOptions.routes,
      router: browserRouter,
      routerOptions,
      onSSRAppRendered,
      triggerOnSSRAppRendered,
      initialState: {},
      transformState,
      routePath,
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
      hydrateRoot(container, (
        <HelmetProvider>
          <SiteMetadataDefaults />
          <RouterProvider router={router!} />
        </HelmetProvider>
      ))
    })()
  }

  return createRoot
}

export { default as Head } from './components/Head'
