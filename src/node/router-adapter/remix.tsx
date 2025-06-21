import type { IncomingMessage, ServerResponse } from 'node:http'
import type { FilledContext } from 'react-helmet-async'
import type { LoaderFunction, LoaderFunctionArgs } from 'react-router-dom'
import type { StaticHandlerContext } from 'react-router-dom/server'
import type { Connect } from 'vite'
import type { IRouterAdapter } from './interface'
import type { ViteReactSSGContext } from '~/types'
import { HelmetProvider } from 'react-helmet-async'
import { fromNodeRequest, stripDataParam, toNodeRequest } from '~/pollfill/node-adapter'
import { removeLeadingSlash, withTrailingSlash } from '~/utils/path'
import { convertRoutesToDataRoutes } from '~/utils/remix-router'
import { renderStaticApp } from '../serverRenderer'
import { createRequest } from '../utils'
import { extractHelmet } from './utils'

export class RemixAdapter implements IRouterAdapter<ViteReactSSGContext> {
  context: ViteReactSSGContext<true>
  constructor(context: ViteReactSSGContext) {
    this.context = context
  }

  async render(path: string) {
    const { base, routes, getStyleCollector, routerOptions } = this.context
    const fetchUrl = `${withTrailingSlash(base)}${removeLeadingSlash(path)}`
    const request = createRequest(fetchUrl)
    const styleCollector = getStyleCollector ? await getStyleCollector() : null
    const helmetContext = {} as FilledContext
    let routerContext: StaticHandlerContext | null = null
    const { StaticRouterProvider, createStaticHandler, createStaticRouter } = await import('react-router-dom/server.js')
    const { dataRoutes, query } = createStaticHandler([...routes], { basename: base })
    const _context = await query(request)

    if (_context instanceof Response)
      throw _context

    routerContext = _context
    const router = createStaticRouter(dataRoutes, routerContext, { future: routerOptions.future })
    let app = (
      <HelmetProvider context={helmetContext}>
        <StaticRouterProvider router={router} context={routerContext} />
      </HelmetProvider>
    )

    if (styleCollector)
      app = styleCollector.collect(app)

    const appHTML = await renderStaticApp(app)

    const { htmlAttributes, bodyAttributes, metaAttributes, styleTag } = extractHelmet(appHTML, helmetContext, styleCollector)

    return { appHTML, htmlAttributes, bodyAttributes, metaAttributes, styleTag, routerContext }
  }

  handleLoader: (req: Connect.IncomingMessage, res: ServerResponse<IncomingMessage>) => void = async (req, res) => {
    const { routes, base } = this.context
    const { matchRoutes } = await import('react-router-dom')
    const request = fromNodeRequest(req)
    const url = new URL(request.url)
    const routeId = decodeURIComponent(url.searchParams.get('_data')!)
    const matches = matchRoutes(
      convertRoutesToDataRoutes([...routes], route => route),
      {
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        state: null,
        key: 'default',
      },
      base,
    )
    if (!matches) {
      res.statusCode = 404
      res.end(`Route not found: ${routeId}`)
      return
    }
    const match = matches.find(m => m.route.id === routeId)
    if (!match) {
      res.statusCode = 404
      res.end(`Route not found: ${routeId}`)
      return
    }
    const loader = match.route.loader ?? await match.route.lazy?.()
      .then(m => m.loader)
    if (!loader) {
      res.statusCode = 200
      res.end(`There is no loader for the route: ${routeId}`)
      return
    }
    const response = await callRouteLoader({
      loader: loader as LoaderFunction,
      params: match.params,
      request,
      routeId,
    })
    await toNodeRequest(response, res)
  }
}

export async function callRouteLoader({
  // loadContext,
  loader,
  params,
  request,
  routeId,
}: {
  request: Request
  loader: LoaderFunction
  params: LoaderFunctionArgs['params']
  routeId: string
}) {
  const { json } = await import('react-router-dom')
  const result = await loader({
    request: stripDataParam(stripIndexParam(request)),
    params,
  })

  if (result === undefined) {
    throw new Error(
      `You defined a loader for route "${routeId}" but didn't return `
      + `anything from your \`loader\` function. Please return a value or \`null\`.`,
    )
  }

  return isResponse(result) ? result : json(result)
}

function isResponse(value: any): value is Response {
  return (
    value != null
    && typeof value.status === 'number'
    && typeof value.statusText === 'string'
    && typeof value.headers === 'object'
    && typeof value.body !== 'undefined'
  )
}

function stripIndexParam(request: Request) {
  const url = new URL(request.url)
  const indexValues = url.searchParams.getAll('index')
  url.searchParams.delete('index')
  const indexValuesToKeep = []
  for (const indexValue of indexValues) {
    if (indexValue) {
      indexValuesToKeep.push(indexValue)
    }
  }
  for (const toKeep of indexValuesToKeep) {
    url.searchParams.append('index', toKeep)
  }

  const init: RequestInit = {
    method: request.method,
    body: request.body,
    headers: request.headers,
    signal: request.signal,
  }

  if (init.body) {
    (init as { duplex: 'half' }).duplex = 'half'
  }

  return new Request(url.href, init)
}
