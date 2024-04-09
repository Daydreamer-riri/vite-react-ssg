import { join } from 'node:path'
import type { InlineConfig, ModuleNode, ViteDevServer } from 'vite'
import { createServer as createViteServer, resolveConfig, version as viteVersion } from 'vite'
import fs from 'fs-extra'
import { bgLightCyan, bold, cyan, dim, green, red, reset } from 'kolorist'
import type { RouteRecord, ViteReactSSGContext, ViteReactSSGOptions } from '../types'
import { fromNodeRequest } from '../pollfill/node-adapter'
import { createLink, detectEntry, renderHTML } from './html'
import { joinUrlSegments, resolveAlias, version } from './utils'
import { render } from './server'
import type { CreateRootFactory } from './build'

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
        {
          name: 'vite-react-ssg:dev-server-remix',
          configureServer(server) {
            return () => {
              server.middlewares.use(async (req, res, _next) => {
                try {
                  const url = req.originalUrl!
                  const indexHTML = await viteServer.transformIndexHtml(url, template)

                  const createRoot: CreateRootFactory = await viteServer.ssrLoadModule(ssrEntry).then(m => m.createRoot)
                  const appCtx = await createRoot(false, url) as ViteReactSSGContext<true>
                  const { routes, getStyleCollector, base, app } = appCtx
                  const transformedIndexHTML = (await onBeforePageRender?.(url, indexHTML, appCtx)) || indexHTML

                  const styleCollector = getStyleCollector ? await getStyleCollector() : null

                  const { appHTML, bodyAttributes, htmlAttributes, metaAttributes, styleTag, routerContext }
                    = await render(app ?? [...routes], fromNodeRequest(req), styleCollector, base)

                  metaAttributes.push(styleTag)

                  const matchesEntries = routerContext?.matches
                    .map(match => (match.route as RouteRecord).entry as string)
                    .filter(entry => !!entry)
                    .map(entry => entry[0] === '/' ? entry : `/${entry}`) ?? []
                  const mods = await Promise.all(
                    [ssrEntry, entry, ...matchesEntries].map(async entry => await viteServer.moduleGraph.getModuleByUrl(entry)),
                  )

                  const assetsUrls = new Set<string>()

                  const collectAssets = async (mod: ModuleNode | undefined) => {
                    if (!mod || !mod?.ssrTransformResult)
                      return

                    const { deps = [], dynamicDeps = [] } = mod?.ssrTransformResult
                    const allDeps = [...deps, ...dynamicDeps]
                    for (const dep of allDeps) {
                      if (dep.endsWith('.css')) {
                        assetsUrls.add(dep)
                      }
                      else if (dep.endsWith('.ts') || dep.endsWith('.tsx')) {
                        const depModule = await viteServer.moduleGraph.getModuleByUrl(dep)
                        depModule && await collectAssets(depModule)
                      }
                    }
                  }
                  await Promise.all(mods.map(async mod => collectAssets(mod)))
                  const preloadLink = [...assetsUrls].map(item => createLink(joinUrlSegments(config.base, item)))
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

                  res.statusCode = 200
                  res.setHeader('Content-Type', 'text/html')
                  res.end(transformed)
                }
                catch (e: any) {
                  viteServer.ssrFixStacktrace(e)
                  console.error(`[vite-react-ssg] error: ${e.stack}`)
                  res.statusCode = 500
                  res.end(e.stack)
                }
              })
            }
          },
        },
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
