import type { ViteReactSSGContext } from '../types'

export type SSRManifest = Record<string, string[]>

export interface ManifestItem {
  css?: string[]
  file: string
  dynamicImports?: string[]
  src: string
  assets?: string[]
}

export type Manifest = Record<string, ManifestItem>

export type StaticLoaderDataManifest = Record<string, string>

export type CreateRootFactory = (
  client: boolean,
  routePath?: string,
) => Promise<ViteReactSSGContext<true> | ViteReactSSGContext<false>>
