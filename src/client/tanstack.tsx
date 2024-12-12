import React from 'react'
import { HelmetProvider } from 'react-helmet-async'
import type { AnyContext, AnyRouter, LoaderFnContext } from '@tanstack/react-router'
import { RouterProvider } from '@tanstack/react-router'
import { Meta, StartClient } from '@tanstack/start'
import { createRoot as ReactDOMCreateRoot, hydrateRoot } from 'react-dom/client'
import { hydrate, render } from 'react-dom'
import type { ViteReactSSGContext as BaseViteReactSSGContext, ViteReactSSGClientOptions } from '../types'
import { documentReady } from '../utils/document-ready'
import { deserializeState } from '../utils/state'
import { META_CONTAINER_ID, convertRouteTreeToRouteOption } from '../utils/tanstack-router'
import { joinUrlSegments, stripBase, withLeadingSlash } from '../utils/path'

export * from '../types'

export interface RouterOptions {
  router: AnyRouter
  routes: AnyRouter['routeTree']
  basename?: string
}

export type ViteReactSSGContext<HasRouter extends boolean = true> = Omit<BaseViteReactSSGContext, 'router' | 'routerType'> & {
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
          const isSSR = document.querySelector('[data-server-rendered=true]') !== null
          if (!isSSR)
            return

          // eslint-disable-next-line ts/no-empty-object-type
          node.options.loader = async (ctx: LoaderFnContext<any, {}, {}, {}, AnyContext, AnyContext>) => {
            let pathname = ctx.location.pathname
            if (process.env.NODE_ENV === 'development') {
              const routeId = encodeURIComponent(node.id)
              const dataQuery = `_data=${routeId}`
              const href = ctx.location.href
              const url = href.includes('?') ? `${href}&${dataQuery}` : `${href}?${dataQuery}`
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
              const manifestUrl = joinUrlSegments(BASE_URL, `static-loader-data-manifest-${window.__VITE_REACT_SSG_HASH__}.json`)
              staticLoadData = await (await fetch(withLeadingSlash(manifestUrl))).json()
              window.__VITE_REACT_SSG_STATIC_LOADER_DATA__ = staticLoadData
            }
            if (BASE_URL !== '/') {
              pathname = stripBase(pathname, BASE_URL)
            }
            const routeData = staticLoadData?.[pathname]?.find((item: { id: string }) => item.id === node.id)
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
      const isSSR = document.querySelector('[data-server-rendered=true]') !== null
      if (!isSSR && process.env.NODE_ENV === 'development') {
        if (options.useLegacyRender) {
          render(
            <HelmetProvider>
              <RouterProvider router={router} />
            </HelmetProvider>,
            container,
          )
        }
        else {
          const root = ReactDOMCreateRoot(container)
          React.startTransition(() => {
            root.render(
              <HelmetProvider>
                <RouterProvider router={router} />
              </HelmetProvider>,
            )
          })
        }
      }
      else {
        if (options.useLegacyRender) {
          hydrate(
            <HelmetProvider>
              <StartClient router={router} />
            </HelmetProvider>,
            container,
          )
        }
        else {
          React.startTransition(() => {
            hydrateRoot(
              container,
              <HelmetProvider>
                <StartClient router={router} />
              </HelmetProvider>,
            )
          })
        }
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
