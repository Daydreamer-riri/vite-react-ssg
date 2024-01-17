import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { blue, gray, yellow } from 'kolorist'
import type { ResolvedConfig } from 'vite'
import type { RouteRecord } from '../types'

export function buildLog(text: string, count?: number) {
  // eslint-disable-next-line no-console
  console.log(`\n${gray('[vite-react-ssg]')} ${yellow(text)}${count ? blue(` (${count})`) : ''}`)
}

export function getSize(str: string) {
  return `${(str.length / 1024).toFixed(2)} KiB`
}

export async function routesToPaths(routes?: Readonly<RouteRecord[]>) {
  const pathToEntry: Record<string, Set<string>> = {}
  function addEntry(path: string, entry: string | undefined) {
    if (!entry)
      return
    if (entry[0] === '/')
      entry = entry.slice(1) // allow to start with a slash
    if (pathToEntry[path])
      pathToEntry[path].add(entry)
    else
      pathToEntry[path] = new Set([entry])
  }

  if (!routes || routes.length === 0)
    return { paths: ['/'], pathToEntry }

  const paths = new Set<string>()
  const lazyPaths = new Set<string>()

  const getPaths = async (routes: Readonly<RouteRecord[]>, prefix = '') => {
    // remove trailing slash
    prefix = prefix.replace(/\/$/g, '')
    for (const route of routes) {
      let path = route.path
      path = handlePath(path, prefix, route.entry)

      if (route.getStaticPaths && path?.includes(':')) {
        const staticPaths = await route.getStaticPaths()
        for (let staticPath of staticPaths) {
          staticPath = handlePath(staticPath, prefix, route.entry) as string
          if (Array.isArray(route.children))
            await getPaths(route.children, staticPath)
        }
      }

      if (route.lazy)
        lazyPaths.add(route.index ? prefix : path ?? '')

      if (route.index)
        addEntry(prefix, route.entry)

      if (Array.isArray(route.children))
        await getPaths(route.children, path)
    }
  }

  await getPaths(routes)
  return { paths: Array.from(paths), pathToEntry, lazyPaths: Array.from(lazyPaths) }

  function handlePath(path: string | undefined, prefix: string, entry: string | undefined) {
    // check for leading slash
    if (path != null) {
      path = (prefix && !path.startsWith('/'))
        ? `${prefix}${path ? `/${path}` : ''}`
        : path

      paths.add(path)
      addEntry(path, entry)

      if (pathToEntry[prefix]) {
        const pathCopy = path
        pathToEntry[prefix].forEach(entry => addEntry(pathCopy, entry))
      }
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

export const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url)).toString(),
)

export function createRequest(path: string) {
  const url = new URL(path, 'http://vite-react-ssg.com')
  url.search = ''
  url.hash = ''
  url.pathname = path

  return new Request(url.href)
}

export function joinUrlSegments(a: string, b: string): string {
  if (!a || !b)
    return a || b || ''

  if (a[a.length - 1] === '/')
    a = a.substring(0, a.length - 1)

  if (b[0] !== '/')
    b = `/${b}`

  return a + b
}

export function removeLeadingSlash(str: string): string {
  return str[0] === '/' ? str.slice(1) : str
}

export function stripBase(path: string, base: string): string {
  if (path === base)
    return '/'

  const devBase = withTrailingSlash(base)
  return path.startsWith(devBase) ? path.slice(devBase.length - 1) : path
}

export function withTrailingSlash(path: string): string {
  if (path[path.length - 1] !== '/')
    return `${path}/`

  return path
}

const postfixRE = /[?#].*$/s
export function cleanUrl(url: string): string {
  return url.replace(postfixRE, '')
}
