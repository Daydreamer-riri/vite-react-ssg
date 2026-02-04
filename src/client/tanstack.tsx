import type {
  AnyContext,
  AnyRouter,
  LoaderFnContext,
} from '@tanstack/react-router'
import type {
  ViteReactSSGContext as BaseViteReactSSGContext,
  ViteReactSSGClientOptions,
} from '../types'
import { RouterProvider } from '@tanstack/react-router'
import { Meta } from '@tanstack/start'
import React from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { hydrate, render } from '../pollfill/react-helper'
import { documentReady } from '../utils/document-ready'
import { joinUrlSegments, stripBase, withLeadingSlash } from '../utils/path'
import { deserializeState } from '../utils/state'
import {
  convertRouteTreeToRouteOption,
  META_CONTAINER_ID,
} from '../utils/tanstack-router'

export * from '../types'

export interface RouterOptions {
  router: AnyRouter
  routes: AnyRouter['routeTree']
  basename?: string
}

export type ViteReactSSGContext<HasRouter extends boolean = true> = Omit<
  BaseViteReactSSGContext,
  'router' | 'routerType'
> & {
  router: HasRouter extends true ? AnyRouter : undefined
  routeTree?: AnyRouter['routeTree']
  routerType: 'tanstack'
}

const HAS_ADD_META_FLAG_KEY = 'HAS_ADD_META_FLAG_KEY'

export function Experimental_ViteReactSSG(
  routerOptions: RouterOptions,
  fn?: (context: ViteReactSSGContext<true>) => Promise<void> | void,
  options: ViteReactSSGClientOptions = {},
) {
  throw new Error(
    '[vite-react-ssg] Sorry, this Version has no support for tanstack router. Please contact me via GitHub issue if you need this feature.',
  )
  const {
    transformState,
    rootContainer = '#root',
    ssrWhenDev,
    getStyleCollector = null,
  } = options

  if (process.env.NODE_ENV === 'development' && ssrWhenDev !== undefined) {
    console.warn(
      '[vite-react-ssg] `ssrWhenDev` option is no longer needed. If you want to use csr, just replace `vite-react-ssg dev` with `vite`.',
    )
  }

  const isClient = typeof window !== 'undefined'

  const BASE_URL = routerOptions.basename ?? '/'

  const routeTree = routerOptions.routes
  const OriginComponent = routeTree.options.component!
  if (!OriginComponent[HAS_ADD_META_FLAG_KEY]) {
    const component = () => (
      <>
        <OriginComponent />
        <div id={META_CONTAINER_ID} style={{ display: 'none' }}>
          <Meta />
        </div>
      </>
    )
    component[HAS_ADD_META_FLAG_KEY] = true
    routeTree.update({
      component,
    })
  }

  async function createRoot(client = false, routePath?: string) {
    const routes = await convertRouteTreeToRouteOption(
      routerOptions.routes,
      client,
      client
        ? node => {
          const isSSR
            = document.querySelector('[data-server-rendered=true]') !== null
          if (!isSSR)
            return

          node.options.loader = async (
            ctx: LoaderFnContext<
                any,
                '__root__',
                {},
                {},
                AnyContext,
                AnyContext
              >,
          ) => {
            let pathname = ctx.location.pathname
            if (process.env.NODE_ENV === 'development') {
              const routeId = encodeURIComponent(node.id)
              const dataQuery = `_data=${routeId}`
              const href = ctx.location.href
              const url = href.includes('?')
                ? `${href}&${dataQuery}`
                : `${href}?${dataQuery}`
              const res = await fetch(url)
              const header = res.headers
              const contentType = header.get('content-type')
              if (contentType?.startsWith('application/json'))
                return res.json()
              return res.text()
            }
            let staticLoadData: any
            if (window.__VITE_REACT_SSG_STATIC_LOADER_DATA__) {
              staticLoadData = window.__VITE_REACT_SSG_STATIC_LOADER_DATA__
            }
            else {
              const manifestUrl = joinUrlSegments(
                BASE_URL,
                  `static-loader-data-manifest-${window.__VITE_REACT_SSG_HASH__}.json`,
              )
              staticLoadData = await (
                await fetch(withLeadingSlash(manifestUrl))
              ).json()
              window.__VITE_REACT_SSG_STATIC_LOADER_DATA__ = staticLoadData
            }
            if (BASE_URL !== '/') {
              pathname = stripBase(pathname, BASE_URL)
            }
            const routeData = staticLoadData?.[pathname]?.find(
              (item: { id: string }) => item.id === node.id,
            )
            return routeData?.loaderData ?? null
          }
        }
        : undefined,
    )
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
      context.initialState
        = transformState?.(window.__INITIAL_STATE__ || {})
          || deserializeState(window.__INITIAL_STATE__)
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
      const container
        = typeof rootContainer === 'string'
          ? document.querySelector(rootContainer)
          : rootContainer

      if (!container) {
        // @ts-expect-error global variable
        if (typeof $jsdom === 'undefined')
          console.warn('[vite-react-ssg] Root container not found.')
        return
      }

      const context = await createRoot(true)
      window.__VITE_REACT_SSG_CONTEXT__ = context as any

      const { router } = context
      const isSSR
        = document.querySelector('[data-server-rendered=true]') !== null
      if (!isSSR && process.env.NODE_ENV === 'development') {
        render(
          <HelmetProvider>
            <RouterProvider router={router} />
          </HelmetProvider>,
          container,
          options,
        )
      }
      else {
        hydrate(
          <HelmetProvider>
            <RouterClient router={router} />
          </HelmetProvider>,
          container,
          options,
        )
      }
    })()
  }

  return createRoot
}

declare global {
  interface Window {
    /** Manifest index: route path -> data file path */
    __VITE_REACT_SSG_STATIC_LOADER_MANIFEST__: Record<string, string>
    /** Cached loader data: route path -> loader data */
    __VITE_REACT_SSG_STATIC_LOADER_DATA__: Record<
      string,
      Record<string, unknown>
    >
    __VITE_REACT_SSG_HASH__: string
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-ignore
    __VITE_REACT_SSG_CONTEXT__: ViteReactSSGContext<true>
  }
}

export { registerPaths } from '../utils/tanstack-router'
export { default as ClientOnly } from './components/ClientOnly'
export { default as Head } from './components/Head'
