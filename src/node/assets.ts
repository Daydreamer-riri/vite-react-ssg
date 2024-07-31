import { matchRoutes } from 'react-router-dom'
import type { RouteRecord } from '../types'
import type { Manifest, SSRManifest } from './build'

export const DYNAMIC_IMPORT_REGEX = /import\("([^)]+)"\)/g
export enum AssetType {
  style = 'style',
  script = 'script',
  image = 'image',
  font = 'font',
}

interface CollectAssetsOpts {
  routes: RouteRecord[]
  locationArg: string
  base: string
  serverManifest: Manifest
  manifest: Manifest
  ssrManifest: SSRManifest
}

export function collectAssets({
  routes,
  locationArg,
  base,
  serverManifest,
  manifest,
  ssrManifest,
}: CollectAssetsOpts) {
  const matches = matchRoutes([...routes], locationArg, base)
  const routeEntries = matches?.map(item => item.route.entry).filter(Boolean) as string[] ?? []
  const dynamicImports = new Set<string>()
  matches?.forEach(item => {
    let lazyStr = ''
    if (item.route.lazy) {
      lazyStr += item.route.lazy.toString()
    }
    // @ts-expect-error lazy
    if (item.route.Component?._payload?._result) {
      // @ts-expect-error lazy
      lazyStr += item.route.Component._payload._result.toString()
    }
    const match = lazyStr.matchAll(DYNAMIC_IMPORT_REGEX)
    for (const m of match) {
      dynamicImports.add(m[1].split('/').at(-1) ?? '')
    }
  })
  const entries = new Set<string>()
  routeEntries.forEach(e => entries.add(e))
  const manifestEntries = [...Object.entries(serverManifest)]
  dynamicImports.forEach(name => {
    const result = manifestEntries.find(([_, value]) => value.file.endsWith(name))
    if (result) {
      entries.add(result[0])
    }
  })

  const modules = collectModulesForEntries(manifest, entries)
  const assets = new Set<string>()
  Array.from(modules).forEach(id => {
    const files = ssrManifest[id] || []
    files.forEach(file => {
      assets.add(file)
    })
  })
  return assets
}

function collectModulesForEntries(manifest: Manifest, entries: Set<string> | undefined) {
  const mods = new Set<string>()
  if (!entries)
    return mods

  for (const entry of entries)
    collectModules(manifest, entry, mods)

  return mods
}

function collectModules(manifest: Manifest, entry: string | undefined, mods = new Set<string>()) {
  if (!entry)
    return mods

  mods.add(entry)
  manifest[entry]?.dynamicImports?.forEach(item => {
    collectModules(manifest, item, mods)
  })

  return mods
}
