import type { InlineConfig } from 'vite'
import type { ViteReactSSGOptions } from '../types'
import { createBuilder, mergeConfig, resolveConfig } from 'vite'
import { ssgPlugin } from './vite-plugin'

export type {
  CreateRootFactory,
  Manifest,
  ManifestItem,
  SSRManifest,
  StaticLoaderDataManifest,
} from './manifest'

export async function build(
  ssgOptions: Partial<ViteReactSSGOptions> = {},
  viteConfig: InlineConfig = {},
) {
  const mode
    = process.env.MODE || process.env.NODE_ENV || ssgOptions.mode || 'production'
  const config = await resolveConfig(viteConfig, 'build', mode, mode)
  const mergedOptions = Object.assign({}, config.ssgOptions || {}, ssgOptions)

  const builder = await createBuilder(
    mergeConfig(viteConfig, {
      mode: config.mode,
      plugins: [
        ssgPlugin(mergedOptions),
      ],
    }),
  )
  await builder.buildApp()
}
