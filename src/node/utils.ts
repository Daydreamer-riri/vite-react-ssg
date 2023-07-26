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

export function routesToPaths(routes?: Readonly<RouteRecord[]>) {
  const pathToEntry: Record<string, Set<string>> = {}
  function addEntry(path: string, entry: string | undefined) {
    if (!entry)
      return
    if (pathToEntry[path])
      pathToEntry[path].add(entry)
    else
      pathToEntry[path] = new Set([entry])
  }

  if (!routes)
    return { paths: ['/'], pathToEntry }

  const paths: Set<string> = new Set()

  const getPaths = (routes: Readonly<RouteRecord[]>, prefix = '') => {
    // remove trailing slash
    const parentPath = prefix
    prefix = prefix.replace(/\/$/g, '')
    for (const route of routes) {
      let path = route.path

      // check for leading slash
      if (route.path != null) {
        path = (prefix && !route.path.startsWith('/'))
          ? `${prefix}${route.path ? `/${route.path}` : ''}`
          : route.path

        paths.add(path)
        addEntry(path, route.entry)

        if (pathToEntry[parentPath]) {
          const pathCopy = path
          pathToEntry[parentPath].forEach(entry => addEntry(pathCopy, entry))
        }
      }

      if (route.index)
        addEntry(prefix, route.entry)

      if (Array.isArray(route.children))
        getPaths(route.children, path)
    }
  }

  getPaths(routes)
  return { paths: Array.from(paths), pathToEntry }
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
  readFileSync(new URL('../../package.json', import.meta.url)).toString(),
)
