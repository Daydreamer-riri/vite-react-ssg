import React from 'react'
import type { FilledContext } from 'react-helmet-async'
import { HelmetProvider } from 'react-helmet-async'
import { StaticRouterProvider, createStaticHandler, createStaticRouter } from 'react-router-dom/server.js'
import SiteMetadataDefaults from '../client/components/SiteMetadataDefaults'
import type { RouteRecord } from '../types'
import { renderStaticApp } from './serverRenderer'

export async function render(routes: RouteRecord[], request: Request) {
  const { dataRoutes, query } = createStaticHandler(routes)
  const context = await query(request)
  const helmetContext = {}

  if (context instanceof Response)
    throw context

  const router = createStaticRouter(dataRoutes, context)
  const app = (
    <HelmetProvider context={helmetContext}>
      <SiteMetadataDefaults />
      <StaticRouterProvider router={router} context={context} />
    </HelmetProvider>
  )

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
  const metaAttributes = metaStrings.filter(Boolean)

  return { appHTML, htmlAttributes, bodyAttributes, metaAttributes }
}
