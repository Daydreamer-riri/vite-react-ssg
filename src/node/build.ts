import type { InlineConfig } from 'vite'
import type { ViteReactSSGOptions } from '../types'
import { createBuilder, mergeConfig, resolveConfig } from 'vite'
import { detectEntry } from './html'
import { resolveAlias } from './utils'
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
  const htmlEntry = mergedOptions.htmlEntry || 'index.html'
  const entry = mergedOptions.entry ?? await detectEntry(config.root, htmlEntry)
  const ssrEntry = await resolveAlias(config, entry)

  const builder = await createBuilder(
    mergeConfig(viteConfig, {
      mode: config.mode,
      plugins: [
        ssgPlugin({
          ...mergedOptions,
          entry,
          ssrEntry,
          htmlEntry,
        }),
      ],
    }),
  )
  await builder.buildApp()
}
