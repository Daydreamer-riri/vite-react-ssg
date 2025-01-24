import type { ResolvedConfig } from 'vite'
import type { RouteRecord } from '../types'
import { join } from 'node:path'
import { blue, gray, yellow } from 'kolorist'
import { version } from '../../package.json'

export function buildLog(text: string, count?: number) {
  // eslint-disable-next-line no-console
  console.log(`\n${gray('[vite-react-ssg]')} ${yellow(text)}${count ? blue(` (${count})`) : ''}`)
}

export function getSize(str: string) {
  return `${(str.length / 1024).toFixed(2)} KiB`
}

export async function routesToPaths(routes?: Readonly<RouteRecord[]>) {
  if (!routes || routes.length === 0)
    return { paths: ['/'] }

  const paths = new Set<string>()

  const getPaths = async (routes: Readonly<RouteRecord[]>, prefix = '') => {
    // remove trailing slash
    prefix = prefix.replace(/\/$/g, '')
    for (let route of routes) {
      if (route.lazy) {
        const lazyData = await route.lazy()
        if (lazyData) {
          route = {
            ...route,
            ...lazyData,
          }
        }
      }
      let path = route.path
      path = handlePath(path, prefix)

      if (route.getStaticPaths && isDynamicSegmentsRoute(path)) {
        const staticPaths = await route.getStaticPaths()
        for (let staticPath of staticPaths) {
          staticPath = handlePath(staticPath, prefix) as string
          if (Array.isArray(route.children))
            await getPaths(route.children, staticPath)
        }
      }

      if (route.index && !path) {
        paths.add('/')
      }

      if (Array.isArray(route.children))
        await getPaths(route.children, path)
    }
  }

  await getPaths(routes)
  return { paths: Array.from(paths) }

  function handlePath(path: string | undefined, prefix: string) {
    // check for leading slash
    if (path != null) {
      path = (prefix && !path.startsWith('/'))
        ? `${prefix}${path ? `/${path}` : ''}`
        : path

      paths.add(path)
    }

    return path
  }
}

export function createFetchRequest(req: any): Request {
  const origin = `${req.protocol}://${req.get('host')}`
  // Note: This had to take originalUrl into account for presumably vite's proxying
  const url = new URL(req.originalUrl || req.url, origin)

  const controller = new AbortController()
  req.on('close', () => controller.abort())

  const headers = new Headers()

  for (const [key, values] of Object.entries(req.headers)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values)
          headers.append(key, value)
      }
      else {
        headers.set(key, values as any)
      }
    }
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: controller.signal,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD')
    init.body = req.body

  return new Request(url.href, init)
}

export async function resolveAlias(config: ResolvedConfig, entry: string) {
  const resolver = config.createResolver()
  const result = await resolver(entry, config.root)
  return result || join(config.root, entry)
}

export { version }

export function createRequest(path: string) {
  const url = new URL(path, 'http://vite-react-ssg.com')
  url.search = ''
  url.hash = ''
  url.pathname = path

  return new Request(url.href)
}

const postfixRE = /[?#].*$/s
export function cleanUrl(url: string): string {
  return url.replace(postfixRE, '')
}

const dynamicRE = /[:*?]/
function isDynamicSegmentsRoute(route?: string) {
  if (!route)
    return false
  return dynamicRE.test(route)
}
