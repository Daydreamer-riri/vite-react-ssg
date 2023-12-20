import React from 'react'
import type { FilledContext } from 'react-helmet-async'
import { HelmetProvider } from 'react-helmet-async'
import { StaticRouterProvider, createStaticHandler, createStaticRouter } from 'react-router-dom/server.js'
import SiteMetadataDefaults from '../client/components/SiteMetadataDefaults'
import type { RouteRecord, StyleCollector } from '../types'
import { renderStaticApp } from './serverRenderer'
import { createRequest } from './utils'

export async function render(routes: RouteRecord[], request: Request, styleCollector: StyleCollector | null, basename?: string) {
  const { dataRoutes, query } = createStaticHandler(routes, { basename })
  const context = await query(request)
  const helmetContext = {}

  if (context instanceof Response)
    throw context

  const router = createStaticRouter(dataRoutes, context)
  let app = (
    <HelmetProvider context={helmetContext}>
      <SiteMetadataDefaults />
      <StaticRouterProvider router={router} context={context} />
    </HelmetProvider>
  )

  if (styleCollector)
    app = styleCollector.collect(app)

  const appHTML = await renderStaticApp(app)

  const { helmet } = helmetContext as FilledContext
  const htmlAttributes = helmet.htmlAttributes.toString()
  const bodyAttributes = helmet.bodyAttributes.toString()
  const metaStrings = [
    helmet.title.toString(),
    helmet.meta.toString(),
    helmet.link.toString(),
    helmet.script.toString(),
  ]
  const styleTag = styleCollector?.toString?.(appHTML) ?? ''
  const metaAttributes = metaStrings.filter(Boolean)

  return { appHTML, htmlAttributes, bodyAttributes, metaAttributes, styleTag, routerContext: context }
}

export async function preLoad(routes: RouteRecord[], paths: string[] | undefined) {
  if (!paths || paths.length === 0)
    return routes

  const { dataRoutes, query } = createStaticHandler(routes)
  await Promise.all(paths.map(async path => {
    const request = createRequest(path)
    return query(request)
  }))
  return dataRoutes as RouteRecord[]
}
