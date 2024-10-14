/* eslint-disable no-console */
import { dirname, isAbsolute, join, parse } from 'node:path'
import { createRequire } from 'node:module'
import { blue, cyan, dim, gray, green, red, yellow } from 'kolorist'
import PQueue from 'p-queue'
import fs from 'fs-extra'
import type { InlineConfig } from 'vite'
import { createLogger, mergeConfig, resolveConfig, build as viteBuild, version as viteVersion } from 'vite'
import type { VitePluginPWAAPI } from 'vite-plugin-pwa'
import { JSDOM } from 'jsdom'
import type { RouteRecord, ViteReactSSGContext, ViteReactSSGOptions } from '../types'
import { serializeState } from '../utils/state'
import { removeLeadingSlash, withLeadingSlash, withTrailingSlash } from '../utils/path'
import { buildLog, getSize, resolveAlias, routesToPaths } from './utils'
import { getCritters } from './critial'
import { serverRender } from './server'
import { SCRIPT_COMMENT_PLACEHOLDER, detectEntry, renderHTML } from './html'
import { renderPreloadLinks } from './preload-links'
import { collectAssets } from './assets'

const dotVitedir = Number.parseInt(viteVersion) >= 5 ? ['.vite'] : []
export type SSRManifest = Record<string, string[]>
export interface ManifestItem {
  css?: string[]
  file: string
  dynamicImports?: string[]
  src: string
  assets?: string[]
}

export type Manifest = Record<string, ManifestItem>

export type StaticLoaderDataManifest = Record<string, Record<string, unknown> | undefined>

export type CreateRootFactory = (client: boolean, routePath?: string) => Promise<ViteReactSSGContext<true> | ViteReactSSGContext<false>>

function DefaultIncludedRoutes(paths: string[], _routes: Readonly<RouteRecord[]>) {
  // ignore dynamic routes
  return paths.filter(i => !i.includes(':') && !i.includes('*'))
}

export async function build(ssgOptions: Partial<ViteReactSSGOptions> = {}, viteConfig: InlineConfig = {}) {
  const mode = process.env.MODE || process.env.NODE_ENV || ssgOptions.mode || 'production'
  const config = await resolveConfig(viteConfig, 'build', mode, mode)
  const cwd = process.cwd()
  const root = config.root || cwd
  const hash = Math.random().toString(36).substring(2, 12)
  const ssgOut = join(root, '.vite-react-ssg-temp', hash)
  const outDir = config.build.outDir || 'dist'
  const out = isAbsolute(outDir) ? outDir : join(root, outDir)
  const configBase = config.base

  const {
    script = 'sync',
    mock = false,
    entry = await detectEntry(root),
    formatting = 'none',
    crittersOptions = {},
    includedRoutes: configIncludedRoutes = DefaultIncludedRoutes,
    onBeforePageRender,
    onPageRendered,
    onFinished,
    dirStyle = 'flat',
    includeAllRoutes = false,
    format = 'esm',
    concurrency = 20,
    rootContainerId = 'root',
  }: ViteReactSSGOptions = Object.assign({}, config.ssgOptions || {}, ssgOptions)

  if (fs.existsSync(ssgOut))
    await fs.remove(ssgOut)

  const clientLogger = createLogger()
  const loggerWarn = clientLogger.warn
  clientLogger.warn = (msg: string, options) => {
    if (msg.includes('vite:resolve') && msg.includes('externalized for browser compatibility'))
      return
    loggerWarn(msg, options)
  }
  // client
  buildLog('Build for client...')
  await viteBuild(mergeConfig(viteConfig, {
    build: {
      manifest: true,
      ssrManifest: true,
      rollupOptions: {
        input: {
          app: join(root, './index.html'),
        },
        // @ts-expect-error rollup type
        onLog(level, log, handler) {
          if (log.message.includes('react-helmet-async'))
            return
          handler(level, log)
        },
      },
    },
    customLogger: clientLogger,
    mode: config.mode,
    ssr: { noExternal: ['vite-react-ssg'] },
  }))

  if (mock) {
    // @ts-expect-error allow js
    const { jsdomGlobal }: { jsdomGlobal: () => void } = await import('./jsdomGlobal.mjs')
    jsdomGlobal()
  }

  // server
  buildLog('Build for server...')
  process.env.VITE_SSG = 'true'
  const ssrEntry = await resolveAlias(config, entry)
  await viteBuild(mergeConfig(viteConfig, {
    build: {
      ssr: ssrEntry,
      manifest: true,
      outDir: ssgOut,
      minify: false,
      cssCodeSplit: false,
      rollupOptions: {
        output: format === 'esm'
          ? {
              entryFileNames: '[name].mjs',
              format: 'esm',
            }
          : {
              entryFileNames: '[name].cjs',
              format: 'cjs',
            },
      },
    },
    mode: config.mode,
    ssr: { noExternal: ['vite-react-ssg', 'vite-react-ssg/tanstack'] },
  }))

  const prefix = (format === 'esm' && process.platform === 'win32') ? 'file://' : ''
  const ext = format === 'esm' ? '.mjs' : '.cjs'
  const serverEntry = join(prefix, ssgOut, parse(ssrEntry).name + ext)
  const serverManifest: Manifest = JSON.parse(await fs.readFile(join(ssgOut, ...dotVitedir, 'manifest.json'), 'utf-8'))

  const _require = createRequire(import.meta.url)

  const { createRoot, includedRoutes: serverEntryIncludedRoutes }: { createRoot: CreateRootFactory, includedRoutes: ViteReactSSGOptions['includedRoutes'] } = format === 'esm'
    ? await import(serverEntry)
    : _require(serverEntry)
  const includedRoutes = serverEntryIncludedRoutes || configIncludedRoutes
  const { routes } = await createRoot(false)

  const { paths } = await routesToPaths(routes)

  let routesPaths = includeAllRoutes
    ? paths
    : await includedRoutes(paths, routes || [])

  routesPaths = DefaultIncludedRoutes(routesPaths, routes || [])

  routesPaths = Array.from(new Set(routesPaths))

  buildLog('Rendering Pages...', routesPaths.length)

  const critters = crittersOptions !== false ? await getCritters(outDir, { publicPath: configBase, ...crittersOptions }) : undefined
  if (critters)
    console.log(`${gray('[vite-react-ssg]')} ${blue('Critical CSS generation enabled via `critters`')}`)

  const ssrManifest: SSRManifest = JSON.parse(await fs.readFile(join(out, ...dotVitedir, 'ssr-manifest.json'), 'utf-8'))
  const manifest: Manifest = JSON.parse(await fs.readFile(join(out, ...dotVitedir, 'manifest.json'), 'utf-8'))
  let indexHTML = await fs.readFile(join(out, 'index.html'), 'utf-8')
  indexHTML = rewriteScripts(indexHTML, script)

  const queue = new PQueue({ concurrency })
  const crittersQueue = new PQueue({ concurrency: 1 })

  const staticLoaderDataManifest: Record<string, unknown> = {}

  for (const path of routesPaths) {
    queue.add(async () => {
      try {
        const appCtx = await createRoot(false, path) as ViteReactSSGContext<true>
        const { base, routes, triggerOnSSRAppRendered, transformState = serializeState, app, routerType } = appCtx

        const transformedIndexHTML = (await onBeforePageRender?.(path, indexHTML, appCtx)) || indexHTML

        const fetchUrl = `${withTrailingSlash(base)}${removeLeadingSlash(path)}`

        const assets = (!app && routerType === 'remix') ? await collectAssets({ routes: [...routes], locationArg: fetchUrl, base, serverManifest, manifest, ssrManifest }) : new Set<string>()

        const { appHTML, bodyAttributes, htmlAttributes, metaAttributes, styleTag, routerContext } = await serverRender(path, appCtx)
        staticLoaderDataManifest[withLeadingSlash(path)] = routerContext?.loaderData

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
        transformed = transformed.replace(SCRIPT_COMMENT_PLACEHOLDER, `window.__VITE_REACT_SSG_HASH__ = '${hash}'`)
        if (critters) {
          transformed = (await crittersQueue.add(() => critters.process(transformed)))!
          transformed = transformed.replace(/<link\srel="stylesheet"/g, '<link rel="stylesheet" crossorigin')
        }

        if (styleTag)
          transformed = transformed.replace('<head>', `<head>${styleTag}`)

        const formatted = await formatHtml(transformed, formatting)

        const relativeRouteFile = `${(path.endsWith('/')
          ? `${path}index`
          : path).replace(/^\//g, '')}.html`

        const filename = dirStyle === 'nested'
          ? join(path.replace(/^\//g, ''), 'index.html')
          : relativeRouteFile

        await fs.ensureDir(join(out, dirname(filename)))
        await fs.writeFile(join(out, filename), formatted, 'utf-8')
        config.logger.info(
          `${dim(`${outDir}/`)}${cyan(filename.padEnd(15, ' '))}  ${dim(getSize(formatted))}`,
        )
      }
      catch (err: any) {
        throw new Error(`${gray('[vite-react-ssg]')} ${red(`Error on page: ${cyan(path)}`)}\n${err.stack}`)
      }
    })
  }

  await queue.start().onIdle()

  buildLog('Generating static loader data manifest...')
  const staticLoaderDataManifestString = JSON.stringify(staticLoaderDataManifest, null, 0)
  await fs.writeFile(join(out, `static-loader-data-manifest-${hash}.json`), staticLoaderDataManifestString)
  config.logger.info(
    `${dim(`${outDir}/`)}${cyan(`static-loader-data-manifest-${hash}.json`.padEnd(15, ' '))}  ${dim(getSize(staticLoaderDataManifestString))}`,
  )

  await fs.remove(join(root, '.vite-react-ssg-temp'))

  const pwaPlugin: VitePluginPWAAPI = config.plugins.find(i => i.name === 'vite-plugin-pwa')?.api
  if (pwaPlugin && !pwaPlugin.disabled && pwaPlugin.generateSW) {
    buildLog('Regenerate PWA...')
    await pwaPlugin.generateSW()
  }

  console.log(`\n${gray('[vite-react-ssg]')} ${green('Build finished.')}`)

  await onFinished?.()

  const waitInSeconds = 15
  const timeout = setTimeout(() => {
    console.log(`${gray('[vite-react-ssg]')} ${yellow(`Build process still running after ${waitInSeconds}s`)}.  There might be something misconfigured in your setup. Force exit.`)
    process.exit(0)
  }, waitInSeconds * 1000)
  timeout.unref()
}

function rewriteScripts(indexHTML: string, mode?: string) {
  if (!mode || mode === 'sync')
    return indexHTML
  return indexHTML.replace(/<script type="module" /g, `<script type="module" ${mode} `)
}

async function formatHtml(html: string, formatting: ViteReactSSGOptions['formatting']) {
  if (formatting === 'prettify') {
    try {
      // @ts-expect-error dynamic import
      const prettier = (await import('prettier/esm/standalone.mjs')).default
      // @ts-expect-error dynamic import
      const parserHTML = (await import('prettier/esm/parser-html.mjs')).default

      return prettier.format(html, { semi: false, parser: 'html', plugins: [parserHTML] })
    }
    catch (e: any) {
      console.error(`${gray('[vite-react-ssg]')} ${red(`Error formatting html: ${e?.message}`)}`)
      return html
    }
  }
  return html
}
