/* eslint-disable no-console */
import type {
  Connect,
  EnvironmentModuleNode,
  EnvironmentOptions,
  PluginOption,
  ResolvedConfig,
  UserConfig,
  ViteBuilder,
  ViteDevServer,
} from 'vite'
import type { ViteReactSSGContext as ViteReactSSGTanstackContext } from '../../client/tanstack'
import type { RouteRecord, ViteReactSSGContext, ViteReactSSGOptions } from '../../types'
import type { CreateRootFactory, Manifest, SSRManifest, StaticLoaderDataManifest } from '../manifest'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, parse } from 'node:path'
import fs from 'fs-extra'
import { JSDOM } from 'jsdom'
import { blue, cyan, dim, gray, green, red, yellow } from 'kolorist'
import PQueue from 'p-queue'
import {
  createServerModuleRunner,
  isRunnableDevEnvironment,
  send,
  version as viteVersion,
} from 'vite'
import { joinUrlSegments, removeLeadingSlash, stripBase, withLeadingSlash, withTrailingSlash } from '../../utils/path'
import { serializeState } from '../../utils/state'
import { collectAssets } from '../assets'
import { getBeastiesOrCritters } from '../critial'
import { createLink, detectEntryFromHtml, renderHTML, SCRIPT_COMMENT_PLACEHOLDER } from '../html'
import { renderPreloadLinks } from '../preload-links'
import { getAdapter } from '../router-adapter'
import { buildLog, getSize, resolveAlias, routesToPaths } from '../utils'

const DOT_VITE_DIR = '.vite'
const SSG_TEMP_DIR = '.vite-react-ssg-temp'
const DEFAULT_HTML_ENTRY = 'index.html'

function buildBundlerOptions<T extends Record<string, unknown>>(options: T) {
  return Number.parseInt(viteVersion) >= 8
    ? { rolldownOptions: options }
    : { rollupOptions: options }
}

function DefaultIncludedRoutes(paths: string[], _routes: Readonly<RouteRecord[]>) {
  return paths.filter(i => !i.includes(':') && !i.includes('*'))
}

function getLoaderDataFilePath(routePath: string, hash: string): string {
  const normalized
    = routePath === '/'
      ? '/index'
      : routePath.endsWith('/')
        ? `${routePath}index`
        : routePath
  return `static-loader-data${withLeadingSlash(normalized)}.${hash}.json`
}

export interface SsgPluginOptions extends Partial<ViteReactSSGOptions> {
  /** Resolved path to the SSR entry module. Auto-resolved from `entry` if omitted. */
  ssrEntry?: string
  /** Original (unresolved) entry value. Auto-detected from the HTML template if omitted. */
  entry?: string
  /** HTML template contents. Read from disk lazily if omitted. */
  template?: string
  htmlEntry?: string
  rootContainerId?: string
}

// Back-compat alias for the prior name used by `dev.ts`.
export { ssgPlugin as ssrServerPlugin }

export interface Options<Context = ViteReactSSGContext> extends ViteReactSSGOptions<Context> {
  template: string
  ssrEntry: string
  entry: string
  rootContainerId: string
}

export interface HandlerCreaterOptions<Context> extends Options<Context> {
  server: ViteDevServer
  ssgContext: Context
}

/**
 * Unified Vite plugin for vite-react-ssg.
 *
 * - Dev: drives SSR via the ssr environment's ModuleRunner and collects CSS
 *   preload deps from the ssr environment's module graph.
 * - Build: declares `environments: { client, ssr }` and
 *   `builder.buildApp`, which orchestrates client build → optional jsdom
 *   mock → ssr build → per-route HTML rendering → static-loader-data emission.
 */
export function ssgPlugin(options: SsgPluginOptions = {}): PluginOption {
  const {
    htmlEntry = DEFAULT_HTML_ENTRY,
    rootContainerId = 'root',
    script = 'sync',
    mock = false,
    formatting = 'none',
    includedRoutes: configIncludedRoutes = DefaultIncludedRoutes,
    onBeforePageRender,
    onPageRendered,
    onFinished,
    dirStyle = 'flat',
    includeAllRoutes = false,
    format = 'esm',
    concurrency = 20,
    beastiesOptions,
    crittersOptions,
  } = options

  let entry = options.entry
  let ssrEntry = options.ssrEntry
  let template = options.template

  const resolvedBeastiesOptions = beastiesOptions ?? crittersOptions ?? {}

  let resolvedConfig: ResolvedConfig | undefined

  return {
    name: 'vite-react-ssg',

    async config(userConfig, env) {
      const root = userConfig.root
        ? (isAbsolute(userConfig.root) ? userConfig.root : join(process.cwd(), userConfig.root))
        : process.cwd()

      // Read the template once here so we can both detect the entry and
      // serve the dev middleware without a second disk read in `configResolved`.
      if (!template || !entry) {
        const html = await fs.readFile(join(root, htmlEntry), 'utf-8')
        template ??= html
        entry ??= detectEntryFromHtml(html)
      }

      if (env.command !== 'build')
        return

      const htmlInput = join(root, htmlEntry)

      const clientEnv: EnvironmentOptions = {
        build: {
          manifest: true,
          ssrManifest: true,
          ...buildBundlerOptions({
            input: { app: htmlInput },
            onLog(level: string, log: { message: string }, handler: (level: string, log: unknown) => void) {
              if (log.message.includes('react-helmet-async'))
                return
              handler(level, log)
            },
          }),
        } as any,
      }

      const ssrOutput
        = format === 'esm'
          ? { entryFileNames: '[name].mjs', format: 'esm' as const }
          : { entryFileNames: '[name].cjs', format: 'cjs' as const }

      const ssrEnv: EnvironmentOptions = {
        build: {
          // `ssrEntry` is still unresolved here (resolver needs the
          // ResolvedConfig); Vite accepts the unresolved path and runs it
          // through its own resolver.
          ssr: ssrEntry ?? entry,
          manifest: true,
          outDir: join(root, SSG_TEMP_DIR),
          minify: false,
          cssCodeSplit: false,
          ...buildBundlerOptions({
            output: ssrOutput,
            onLog(level: string, log: { message: string }, handler: (level: string, log: unknown) => void) {
              if (log.message.includes('react-helmet-async'))
                return
              handler(level, log)
            },
          }),
        } as any,
      }

      const updated: UserConfig = {
        environments: {
          client: clientEnv,
          ssr: ssrEnv,
        },
        builder: {
          buildApp: async (builder: ViteBuilder) => {
            await runBuildApp(builder)
          },
        },
      }
      return updated
    },

    async configResolved(config) {
      resolvedConfig = config
      if (!ssrEntry)
        ssrEntry = await resolveAlias(config, entry!)
    },

    configureServer(server) {
      const ssrEnv = server.environments.ssr
      const runner = isRunnableDevEnvironment(ssrEnv)
        ? ssrEnv.runner
        : createServerModuleRunner(ssrEnv)

      const renderMiddleware: Connect.NextHandleFunction = async (req, res, _next) => {
        try {
          const url = req.originalUrl!
          const createRoot = (await runner.import(ssrEntry!)).createRoot as CreateRootFactory
          const appCtx = await createRoot(false, url) as (ViteReactSSGContext<true> | ViteReactSSGTanstackContext)
          const adapter = getAdapter(appCtx)
          const { app, base } = appCtx
          const [pathname, search] = url.split('?')
          const searchParams = new URLSearchParams(search)

          if (!app && searchParams.has('_data')) {
            return adapter.handleLoader(req, res)
          }

          const indexHTML = await server.transformIndexHtml(url, template!)
          const transformedIndexHTML = (await onBeforePageRender?.(url, indexHTML, appCtx as any)) || indexHTML

          const { appHTML, bodyAttributes, htmlAttributes, metaAttributes, styleTag }
            = await adapter.render(stripBase(pathname, base))

          metaAttributes.push(styleTag)
          const mods = await Promise.all(
            [ssrEntry!, entry!].map(async e => await ssrEnv.moduleGraph.getModuleByUrl(e)),
          )

          const assetsUrls = new Set<string>()
          const collectedMods = new Set<EnvironmentModuleNode>()

          const walk = async (mod: EnvironmentModuleNode | undefined) => {
            if (!mod || !mod.transformResult || collectedMods.has(mod))
              return
            collectedMods.add(mod)
            const { deps = [], dynamicDeps = [] } = mod.transformResult
            const allDeps = [...deps, ...dynamicDeps]
            for (const dep of allDeps) {
              if (
                dep.endsWith('.css')
                || dep.endsWith('.scss')
                || dep.endsWith('.sass')
                || dep.endsWith('.less')
              ) {
                assetsUrls.add(dep)
              }
              else if (dep.endsWith('.ts') || dep.endsWith('.tsx')) {
                const depModule = await ssrEnv.moduleGraph.getModuleByUrl(dep)
                depModule && await walk(depModule)
              }
            }
          }
          await Promise.all(mods.map(async mod => walk(mod)))
          const preloadLink = [...assetsUrls].map(item => createLink(joinUrlSegments(server.config.base, item)))
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

          const transformed = await onPageRendered?.(url, renderedHTML, appCtx as any) || renderedHTML

          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          const isDev: boolean = 'pluginContainer' in server
          const headers = isDev
            ? server.config.server.headers
            : server.config.preview.headers
          send(req, res, transformed, 'html', { headers })
        }
        catch (e: any) {
          server.ssrFixStacktrace(e)
          console.error(`[vite-react-ssg] error: ${e.stack}`)
          res.statusCode = 500
          res.end(e.stack)
        }
      }

      return () => {
        server.middlewares.use(renderMiddleware)
      }
    },
  }

  async function runBuildApp(builder: ViteBuilder) {
    const config = resolvedConfig ?? builder.config
    const root = config.root
    const configBase = config.base
    const ssgOut = join(root, SSG_TEMP_DIR)
    const hash = Math.random().toString(36).substring(2, 12)

    if (fs.existsSync(ssgOut))
      await fs.remove(ssgOut)

    // 1. client build
    buildLog('Build for client...')
    await builder.build(builder.environments.client)
    const outDir = builder.environments.client.config.build.outDir || 'dist'

    // 2. jsdom mock + VITE_SSG flag
    let unmock = () => {}
    if (mock) {
      // @ts-expect-error allow js
      const { jsdomGlobal }: { jsdomGlobal: () => () => void } = await import('../jsdomGlobal.mjs')
      unmock = jsdomGlobal()
    }
    process.env.VITE_SSG = 'true'

    // 3. ssr build
    buildLog('Build for server...')
    await builder.build(builder.environments.ssr)

    const prefix = format === 'esm' && process.platform === 'win32' ? 'file://' : ''
    const ext = format === 'esm' ? '.mjs' : '.cjs'
    const serverEntry
      = prefix + join(ssgOut, parse(ssrEntry!).name + ext).replace(/\\/g, '/')
    const serverManifest: Manifest = JSON.parse(
      await fs.readFile(join(ssgOut, DOT_VITE_DIR, 'manifest.json'), 'utf-8'),
    )

    const _require = createRequire(import.meta.url)

    const {
      createRoot,
      includedRoutes: serverEntryIncludedRoutes,
    }: {
      createRoot: CreateRootFactory
      includedRoutes: ViteReactSSGOptions['includedRoutes']
    } = format === 'esm' ? await import(serverEntry) : _require(serverEntry)
    const includedRoutes = serverEntryIncludedRoutes || configIncludedRoutes
    const { routes } = await createRoot(false)

    const { paths } = await routesToPaths(routes)

    let routesPaths = includeAllRoutes
      ? paths
      : await includedRoutes(paths, routes || [])
    routesPaths = DefaultIncludedRoutes(routesPaths, routes || [])
    routesPaths = Array.from(new Set(routesPaths))

    buildLog('Rendering Pages...', routesPaths.length)

    const beasties
      = resolvedBeastiesOptions !== false
        ? await getBeastiesOrCritters(outDir, {
            publicPath: configBase,
            ...resolvedBeastiesOptions,
          })
        : undefined
    if (beasties) {
      console.log(
        `${gray('[vite-react-ssg]')} ${blue('Critical CSS generation enabled via `beasties`')}`,
      )
    }

    const out = isAbsolute(outDir) ? outDir : join(root, outDir)
    const ssrManifest: SSRManifest = JSON.parse(
      await fs.readFile(join(out, DOT_VITE_DIR, 'ssr-manifest.json'), 'utf-8'),
    )
    const manifest: Manifest = JSON.parse(
      await fs.readFile(join(out, DOT_VITE_DIR, 'manifest.json'), 'utf-8'),
    )
    let indexHTML = await fs.readFile(join(out, htmlEntry), 'utf-8')
    fs.rmSync(join(out, htmlEntry))
    indexHTML = rewriteScripts(indexHTML, script)

    const queue = new PQueue({ concurrency })
    const crittersQueue = new PQueue({ concurrency: 1 })

    const staticLoaderDataManifest: StaticLoaderDataManifest = {}
    let loaderDataFileCount = 0

    for (const path of routesPaths) {
      queue.add(async () => {
        try {
          const appCtx = (await createRoot(false, path)) as ViteReactSSGContext<true>
          const {
            base,
            routes,
            triggerOnSSRAppRendered,
            transformState = serializeState,
            app,
            routerType,
          } = appCtx

          const transformedIndexHTML
            = (await onBeforePageRender?.(path, indexHTML, appCtx)) || indexHTML

          const fetchUrl = `${withTrailingSlash(base)}${removeLeadingSlash(path)}`

          const adapter = getAdapter(appCtx)
          const assets
            = !app && routerType === 'remix'
              ? await collectAssets({
                  routes: [...routes],
                  locationArg: fetchUrl,
                  base,
                  serverManifest,
                  manifest,
                  ssrManifest,
                })
              : new Set<string>()

          const {
            appHTML,
            bodyAttributes,
            htmlAttributes,
            metaAttributes,
            styleTag,
            routerContext,
          } = await adapter.render(path)

          const loaderData = routerContext?.loaderData as
            | Record<string, unknown>
            | undefined
          if (loaderData && Object.keys(loaderData).length > 0) {
            const loaderDataFilePath = getLoaderDataFilePath(path, hash)
            await fs.ensureDir(join(out, dirname(loaderDataFilePath)))
            await fs.writeFile(
              join(out, loaderDataFilePath),
              JSON.stringify(loaderData),
            )
            staticLoaderDataManifest[withLeadingSlash(path)] = loaderDataFilePath
            loaderDataFileCount++
          }

          await triggerOnSSRAppRendered?.(path, appHTML, appCtx)

          const renderedHTML = await renderHTML({
            rootContainerId,
            appHTML,
            indexHTML: transformedIndexHTML,
            metaAttributes,
            bodyAttributes,
            htmlAttributes,
            initialState: null,
          })

          const jsdom = new JSDOM(renderedHTML)
          renderPreloadLinks(jsdom.window.document, assets)

          const html = jsdom.serialize()
          let transformed = (await onPageRendered?.(path, html, appCtx)) || html
          transformed = transformed.replace(
            SCRIPT_COMMENT_PLACEHOLDER,
            `window.__VITE_REACT_SSG_HASH__ = '${hash}'`,
          )
          if (beasties) {
            transformed = (await crittersQueue.add(() =>
              beasties.process(transformed),
            ))!
            transformed = transformed.replace(
              /<link\srel="stylesheet"/g,
              '<link rel="stylesheet" crossorigin',
            )
          }

          if (styleTag)
            transformed = transformed.replace('<head>', `<head>${styleTag}`)

          const formatted = await formatHtml(transformed, formatting)

          const relativeRouteFile = `${(path.endsWith('/')
            ? `${path}index`
            : path
          ).replace(/^\//g, '')}.html`

          const filename
            = dirStyle === 'nested'
              ? join(path.replace(/^\//g, ''), 'index.html')
              : relativeRouteFile

          await fs.ensureDir(join(out, dirname(filename)))
          await fs.writeFile(join(out, filename), formatted, 'utf-8')
          config.logger.info(
            `${dim(`${outDir}/`)}${cyan(filename.padEnd(15, ' '))}  ${dim(getSize(formatted))}`,
          )

          // mark transformState as used (existing behavior preserves this
          // for side-effecting overrides that users may set).
          void transformState
        }
        catch (err: any) {
          throw new Error(
            `${gray('[vite-react-ssg]')} ${red(`Error on page: ${cyan(path)}`)}\n${err.stack}`,
          )
        }
      })
    }

    await queue.start().onIdle()

    buildLog('Generating static loader data...', loaderDataFileCount)
    const staticLoaderDataManifestString = JSON.stringify(staticLoaderDataManifest, null, 0)
    await fs.writeFile(
      join(out, `static-loader-data-manifest-${hash}.json`),
      staticLoaderDataManifestString,
    )
    config.logger.info(
      `${dim(`${outDir}/`)}${cyan(`static-loader-data-manifest-${hash}.json`.padEnd(15, ' '))}  ${dim(getSize(staticLoaderDataManifestString))}`,
    )

    await fs.remove(join(root, SSG_TEMP_DIR))

    unmock()
    const pwaPlugin: { disabled: boolean, generateSW: () => Promise<unknown> }
      = config.plugins.find(i => i.name === 'vite-plugin-pwa')?.api
    if (pwaPlugin && !pwaPlugin.disabled && pwaPlugin.generateSW) {
      buildLog('Regenerate PWA...')
      await pwaPlugin.generateSW()
    }

    console.log(`\n${gray('[vite-react-ssg]')} ${green('Build finished.')}`)

    await onFinished?.(outDir)

    const waitInSeconds = 15
    const timeout = setTimeout(() => {
      console.log(
        `${gray('[vite-react-ssg]')} ${yellow(`Build process still running after ${waitInSeconds}s`)}.  There might be something misconfigured in your setup. Force exit.`,
      )
      process.exit(0)
    }, waitInSeconds * 1000)
    timeout.unref()
  }
}

function rewriteScripts(indexHTML: string, mode?: string) {
  if (!mode || mode === 'sync')
    return indexHTML
  return indexHTML.replace(
    /<script type="module" /g,
    `<script type="module" ${mode} `,
  )
}

async function formatHtml(
  html: string,
  formatting: ViteReactSSGOptions['formatting'],
) {
  if (formatting === 'prettify') {
    try {
      // @ts-expect-error dynamic import
      const prettier = (await import('prettier/esm/standalone.mjs')).default
      // @ts-expect-error dynamic import
      const parserHTML = (await import('prettier/esm/parser-html.mjs')).default

      return prettier.format(html, {
        semi: false,
        parser: 'html',
        plugins: [parserHTML],
      })
    }
    catch (e: any) {
      console.error(
        `${gray('[vite-react-ssg]')} ${red(`Error formatting html: ${e?.message}`)}`,
      )
      return html
    }
  }
  return html
}
