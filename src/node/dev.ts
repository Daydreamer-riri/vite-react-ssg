import type { InlineConfig, ViteDevServer } from 'vite'
import type { ViteReactSSGOptions } from '../types'
import { bgLightCyan, bold, cyan, dim, green, red, reset } from 'kolorist'
import { createServer as createViteServer, mergeConfig, resolveConfig, version as viteVersion } from 'vite'
import { version } from './utils'
import { ssgPlugin } from './vite-plugin'

export async function dev(ssgOptions: Partial<ViteReactSSGOptions> = {}, viteConfig: InlineConfig = {}, customOptions?: unknown) {
  const mode = process.env.MODE || process.env.NODE_ENV || ssgOptions.mode || 'development'
  const config = await resolveConfig(viteConfig, 'serve', mode, mode)
  const mergedOptions = Object.assign({}, config.ssgOptions || {}, ssgOptions)

  // @ts-expect-error global var
  globalThis.__ssr_start_time = performance.now()

  let viteServer: ViteDevServer
  try {
    process.env.__DEV_MODE_SSR = 'true'

    if (mergedOptions.mock) {
      // @ts-expect-error allow js
      const { jsdomGlobal }: { jsdomGlobal: () => void } = await import('./jsdomGlobal.mjs')
      jsdomGlobal()
    }

    viteServer = await createViteServer(
      mergeConfig(viteConfig, {
        plugins: [
          ssgPlugin(mergedOptions),
        ],
      }),
    )
    await viteServer.listen()
    printServerInfo(viteServer, !!customOptions)
    viteServer.bindCLIShortcuts({ print: true })
  }
  catch (err: any) {
    console.error(
      `${red('failed to start server. error:')}\n${err.stack}`,
    )
    process.exit(1)
  }
}

export async function printServerInfo(server: ViteDevServer, onlyUrl = false) {
  if (onlyUrl)
    return server.printUrls()

  const info = server.config.logger.info

  let ssrReadyMessage = ' -- SSR'

  // @ts-expect-error global var
  if (globalThis.__ssr_start_time) {
    ssrReadyMessage
      += ` ready in ${reset(bold(`${Math.round(
          // @ts-expect-error global var
          performance.now() - globalThis.__ssr_start_time,
        )}ms`))}`
  }

  info(
      `\n ${bgLightCyan(` VITE-REACT-SSG v${version} `)}`,
      { clear: !server.config.logger.hasWarned },
  )
  info(
        `${cyan(`\n  VITE v${viteVersion}`) + dim(ssrReadyMessage)}\n`,
  )

  info(
    green('  dev server running at:'),
  )

  server.printUrls()
}
