import React from 'react'
import type { ReactNode } from 'react'
import type { FilledContext } from 'react-helmet-async'
import { HelmetProvider } from 'react-helmet-async'
import type { StaticHandlerContext } from 'react-router-dom/server.js'
import type { RootRoute } from '@tanstack/react-router'
import type { RouteRecord, StyleCollector } from '../types'
import { renderStaticApp } from './serverRenderer'
import { createRequest } from './utils'

export async function render(routesOrApp: RouteRecord[] | ReactNode, request: Request, styleCollector: StyleCollector | null, basename?: string) {
  const helmetContext = {} as FilledContext
  let inner: ReactNode
  let context: StaticHandlerContext | null = null

  if (Array.isArray(routesOrApp)) {
    const { StaticRouterProvider, createStaticHandler, createStaticRouter } = await import('react-router-dom/server.js')
    const { dataRoutes, query } = createStaticHandler(routesOrApp, { basename })
    const _context = await query(request)

    if (_context instanceof Response)
      throw _context

    context = _context
    const router = createStaticRouter(dataRoutes, context)
    inner = (
      <StaticRouterProvider router={router} context={context} />
    )
  }
  else {
    inner = routesOrApp
  }
  let app = (
    <HelmetProvider context={helmetContext}>
      {inner}
    </HelmetProvider>
  )

  if (styleCollector)
    app = styleCollector.collect(app)

  const appHTML = await renderStaticApp(app)

  const { htmlAttributes, bodyAttributes, metaAttributes, styleTag } = extractHelmet(helmetContext, styleCollector)

  return { appHTML, htmlAttributes, bodyAttributes, metaAttributes, styleTag, routerContext: context }
}

export async function renderTanstack(routeTree: RootRoute, url: string, styleCollector: StyleCollector | null) {
  const { createRouter, createMemoryHistory } = await import('@tanstack/react-router')
  const { StartServer } = await import('@tanstack/start/server')
  const router = createRouter({ routeTree })
  const memoryHistory = createMemoryHistory({
    initialEntries: [url],
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
  if (styleCollector)
    app = styleCollector.collect(app)

  const appHTML = await renderStaticApp(app)

  const { htmlAttributes, bodyAttributes, metaAttributes, styleTag } = extractHelmet(helmetContext, styleCollector)

  return { appHTML, htmlAttributes, bodyAttributes, metaAttributes, styleTag, routerContext: {} }
}

export async function preLoad(routes: RouteRecord[], paths: string[] | undefined) {
  if (!paths || paths.length === 0)
    return routes

  const { createStaticHandler } = await import('react-router-dom/server.js')
  const { dataRoutes, query } = createStaticHandler(routes)
  await Promise.all(paths.map(async path => {
    const request = createRequest(path)
    return query(request)
  }))
  return dataRoutes as RouteRecord[]
}

function extractHelmet(context: FilledContext, styleCollector: StyleCollector | null) {
  const { helmet } = context
  const htmlAttributes = helmet.htmlAttributes.toString()
  const bodyAttributes = helmet.bodyAttributes.toString()
  let titleString = helmet.title.toString()
  if (titleString.split('>')[1] === '</title') {
    titleString = ''
  }
  const metaStrings = [
    titleString,
    helmet.meta.toString(),
    helmet.link.toString(),
    helmet.script.toString(),
  ]
  const styleTag = styleCollector?.toString?.('') ?? ''
  const metaAttributes = metaStrings.filter(Boolean)

  return { htmlAttributes, bodyAttributes, metaAttributes, styleTag }
}
