import React from 'react'
import { createRoot as ReactDOMCreateRoot, hydrateRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { type AnyRouter, RouterProvider } from '@tanstack/react-router'
import { Meta } from '@tanstack/start'
import type { ViteReactSSGContext as BaseViteReactSSGContext, ViteReactSSGClientOptions } from '../types'
import { documentReady } from '../utils/document-ready'
import { deserializeState } from '../utils/state'
import { META_CONTAINER_ID, convertRouteTreeToRouteOption } from '../utils/tanstack-router'

export * from '../types'

export interface RouterOptions {
  router: AnyRouter
  routes: AnyRouter['routeTree']
  basename?: string
}

export type ViteReactSSGContext<HasRouter extends boolean = true> = Omit<BaseViteReactSSGContext, 'router'> & {
  router: HasRouter extends true ? AnyRouter : undefined
  routeTree?: AnyRouter['routeTree']
}

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

  if (import.meta.env.DEV && ssrWhenDev !== undefined)
    console.warn('[vite-react-ssg] `ssrWhenDev` option is no longer needed. If you want to use csr, just replace `vite-react-ssg dev` with `vite`.')

  const isClient = typeof window !== 'undefined'

  const BASE_URL = routerOptions.basename ?? '/'

  const routeTree = routerOptions.routes
  const OriginComponent = routeTree.options.component!
  const component = () => (
    <>
      <OriginComponent />
      <div id={META_CONTAINER_ID} style={{ display: 'none' }}>
        <Meta />
      </div>
    </>
  )
  routeTree.update({
    component,
  })
  async function createRoot(client = false, routePath?: string) {
    const routes = await convertRouteTreeToRouteOption(routerOptions.routes, client)
    const router = routerOptions.router
    router.options.isServer = !client

    const appRenderCallbacks: Function[] = []
    const onSSRAppRendered = client
      ? () => {}
      : (cb: Function) => appRenderCallbacks.push(cb)
    const triggerOnSSRAppRendered = () => {
      return Promise.all(appRenderCallbacks.map(cb => cb()))
    }

    const context: ViteReactSSGContext<true> = {
      isClient,
      routes,
      routeTree,
      router,
      routerOptions: {
        routes,
        basename: BASE_URL,
      },
      onSSRAppRendered,
      triggerOnSSRAppRendered,
      initialState: {},
      transformState,
      routePath,
      base: BASE_URL,
      getStyleCollector,
      routerType: 'tanstack',
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

      const { router } = await createRoot(true)
      const app = (
        <HelmetProvider>
          <RouterProvider router={router} />
        </HelmetProvider>
      )
      const isSSR = document.querySelector('[data-server-rendered=true]') !== null
      if (!isSSR && import.meta.env.DEV) {
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

declare global {
  interface Window {
    __VITE_REACT_SSG_STATIC_LOADER_DATA__: any
    __VITE_REACT_SSG_HASH__: string
  }
}

export { default as Head } from './components/Head'
export { default as ClientOnly } from './components/ClientOnly'
export { registerPaths } from '../utils/tanstack-router'
