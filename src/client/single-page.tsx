import type { ReactNode } from 'react'
import type { ViteReactSSGClientOptions, ViteReactSSGContext } from '../types'
import React from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { hydrate, render } from '../pollfill/react-helper'
import { documentReady } from '../utils/document-ready'
import { deserializeState } from '../utils/state'

export * from '../types'

export function ViteReactSSG(
  App: ReactNode,
  fn?: (context: ViteReactSSGContext<false>) => Promise<void> | void,
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

  async function createRoot(client = false, routePath?: string) {
    const appRenderCallbacks: Function[] = []
    const onSSRAppRendered = client
      ? () => { }
      : (cb: Function) => appRenderCallbacks.push(cb)
    const triggerOnSSRAppRendered = () => {
      return Promise.all(appRenderCallbacks.map(cb => cb()))
    }
    const context: ViteReactSSGContext<false> = {
      isClient,
      onSSRAppRendered,
      triggerOnSSRAppRendered,
      initialState: {},
      transformState,
      routePath,
      getStyleCollector,
      routes: undefined,
      routerOptions: undefined,
      base: '/',
      app: App,
      routerType: 'single-page',
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
    } as ViteReactSSGContext<false>
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

      const context = await createRoot(true)
      window.__VITE_REACT_SSG_CONTEXT__ = context as any
      const app = (
        <HelmetProvider>
          {App}
        </HelmetProvider>
      ) as React.ReactElement
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
}

export { default as ClientOnly } from './components/ClientOnly'
export { default as Head } from './components/Head'
