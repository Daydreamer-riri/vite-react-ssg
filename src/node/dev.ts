import { join } from 'node:path'
import https from 'node:https'
import type { InlineConfig, Logger, ModuleNode, ViteDevServer } from 'vite'
import { createServer as createViteServer, resolveConfig, version as viteVersion } from 'vite'
import { bgLightCyan, bold, cyan, dim, green, reset } from 'kolorist'
import express from 'express'
import fs from 'fs-extra'
import { certificateFor } from '@childrentime/devcert'
import type { RouteRecord, ViteReactSSGContext, ViteReactSSGOptions } from '../types'
import { createLink, detectEntry, renderHTML } from './html'
import { createFetchRequest, resolveAlias, version } from './utils'
import { render } from './server'
import type { CreateRootFactory } from './build'
import { bindShortcuts } from './shortcuts'

export async function dev(ssgOptions: Partial<ViteReactSSGOptions> = {}, viteConfig: InlineConfig = {}) {
  const mode = process.env.MODE || process.env.NODE_ENV || ssgOptions.mode || 'development'
  const config = await resolveConfig(viteConfig, 'serve', mode, mode)
  const cwd = process.cwd()
  const root = config.root || cwd
  const httpsOptions = config.server.https

  const {
    entry = await detectEntry(root),
    onBeforePageRender,
    onPageRendered,
    rootContainerId = 'root',
  }: ViteReactSSGOptions = Object.assign({}, config.ssgOptions || {}, ssgOptions)

  const ssrEntry = await resolveAlias(config, entry)
  const template = await fs.readFile(join(root, 'index.html'), 'utf-8')
  let viteServer: ViteDevServer

  // @ts-expect-error global var
  globalThis.__ssr_start_time = performance.now()

  createServer().then(async app => {
    const port = viteServer.config.server.port || 5173

    if (httpsOptions) {
      const localHttpsOptions
        = typeof httpsOptions === 'boolean'
          ? await certificateFor(['localhost'])
          : httpsOptions
      const server = https.createServer(localHttpsOptions, app)

      server.listen(port, () => {
        printServerInfo(viteServer, false, true)
        bindShortcuts(viteServer, server)
      })
    }
    else {
      const server = app.listen(port, () => {
        printServerInfo(viteServer)
        bindShortcuts(viteServer, server)
      })
    }
  })

  async function createServer() {
    process.env.__DEV_MODE_SSR = 'true'

    const app = express()

    viteServer = await createViteServer({
      // ...options,
      server: { middlewareMode: true },
      appType: 'custom',
    })

    app.use(viteServer.middlewares)

    app.use('*', async (req, res) => {
      try {
        const url = req.originalUrl
        const indexHTML = await viteServer.transformIndexHtml(url, template)

        const createRoot: CreateRootFactory = await viteServer.ssrLoadModule(ssrEntry).then(m => m.createRoot)
        const appCtx = await createRoot(false, url) as ViteReactSSGContext<true>
        const { routes, getStyleCollector } = appCtx
        const transformedIndexHTML = (await onBeforePageRender?.(url, indexHTML, appCtx)) || indexHTML

        const styleCollector = getStyleCollector ? await getStyleCollector() : null

        const { appHTML, bodyAttributes, htmlAttributes, metaAttributes, styleTag, routerContext }
          = await render([...routes], createFetchRequest(req), styleCollector)

        metaAttributes.push(styleTag)

        const matchesEntries = routerContext.matches
          .map(match => (match.route as RouteRecord).entry as string)
          .filter(entry => !!entry)
          .map(entry => entry[0] === '/' ? entry : `/${entry}`)
        const mods = await Promise.all(
          [entry, ...matchesEntries].map(async entry => await viteServer.moduleGraph.getModuleByUrl(entry)),
        )

        const assetsUrls = new Set<string>()

        const collectAssets = async (mod: ModuleNode | undefined) => {
          if (!mod || !mod?.ssrTransformResult)
            return

          const { deps = [], dynamicDeps = [] } = mod?.ssrTransformResult
          const allDeps = [...deps, ...dynamicDeps]
          for (const dep of allDeps) {
            if (
              dep.endsWith('.css')) {
              assetsUrls.add(dep)
            }
            else if (dep.endsWith('.ts') || dep.endsWith('.tsx')) {
              const depModule = await viteServer.moduleGraph.getModuleByUrl(dep)
              depModule && await collectAssets(depModule)
            }
          }
        }
        await Promise.all(mods.map(async mod => collectAssets(mod)))
        const preloadLink = [...assetsUrls].map(item => createLink(item))
        metaAttributes.push(...preloadLink)

        const renderedHTML = await renderHTML({
          rootContainerId,
          appHTML,
          indexHTML: transformedIndexHTML,
          metaAttributes,
          bodyAttributes,
          htmlAttributes,
          initialState: null,
        })

        const transformed = await onPageRendered?.(url, renderedHTML, appCtx) || renderedHTML

        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed)
      }
      catch (e: any) {
        viteServer.ssrFixStacktrace(e)
        console.error(`[vite-react-ssg] error: ${e.stack}`)
        res.status(500).end(e.stack)
      }
    })
    return app
  }
}

export async function printServerInfo(server: ViteDevServer, onlyUrl = false, https = false) {
  const info = server.config.logger.info
  const port = server.config.server.port || 5173
  const protocol = https ? 'https' : 'http'
  const url = `${protocol}://localhost:${port}/`

  if (!onlyUrl) {
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
  }

  info(
    green('  dev server running at:'),
  )

  printUrls(url, info)
}

function printUrls(url: string, info: Logger['info']) {
  const colorUrl = (url: string) => cyan(url.replace(/:(\d+)\//, (_, port) => `:${bold(port)}/`))
  info(`  ${green('➜')}  ${bold('Local')}:   ${colorUrl(url)}`)
}
