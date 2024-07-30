import { join } from 'node:path'
import type { InlineConfig, ViteDevServer } from 'vite'
import { createServer as createViteServer, resolveConfig, version as viteVersion } from 'vite'
import fs from 'fs-extra'
import { bgLightCyan, bold, cyan, dim, green, red, reset } from 'kolorist'
import type { ViteReactSSGOptions } from '../types'
import { detectEntry } from './html'
import { resolveAlias, version } from './utils'
import { ssrServerPlugin } from './vite-plugin/ssr-server'

export async function dev(ssgOptions: Partial<ViteReactSSGOptions> = {}, viteConfig: InlineConfig = {}, customOptions?: unknown) {
  const mode = process.env.MODE || process.env.NODE_ENV || ssgOptions.mode || 'development'
  const config = await resolveConfig(viteConfig, 'serve', mode, mode)
  const cwd = process.cwd()
  const root = config.root || cwd

  const {
    entry = await detectEntry(root),
    onBeforePageRender,
    onPageRendered,
    rootContainerId = 'root',
    mock = false,
  }: ViteReactSSGOptions = Object.assign({}, config.ssgOptions || {}, ssgOptions)

  const ssrEntry = await resolveAlias(config, entry)
  const template = await fs.readFile(join(root, 'index.html'), 'utf-8')
  let viteServer: ViteDevServer

  // @ts-expect-error global var
  globalThis.__ssr_start_time = performance.now()

  createServer().catch(err => {
    console.error(
      `${red(`failed to start server. error:`)}\n${err.stack}`,
    )
    process.exit(1)
  })

  async function createServer() {
    process.env.__DEV_MODE_SSR = 'true'

    if (mock) {
      // @ts-expect-error allow js
      const { jsdomGlobal }: { jsdomGlobal: () => void } = await import('./jsdomGlobal.mjs')
      jsdomGlobal()
    }

    viteServer = await createViteServer({
      ...viteConfig,
      plugins: [
        ...viteConfig.plugins ?? [],
        ssrServerPlugin({
          template,
          ssrEntry,
          onBeforePageRender,
          onPageRendered,
          entry,
          rootContainerId,
        }),
      ],
    })
    await viteServer.listen()
    printServerInfo(viteServer, !!customOptions)
    viteServer.bindCLIShortcuts({ print: true })
    return viteServer
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
