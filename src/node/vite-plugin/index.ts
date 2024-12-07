import { type Connect, type ModuleNode, type PluginOption, type ViteDevServer, send } from 'vite'
import type { CreateRootFactory } from '../build'
import type { ViteReactSSGContext, ViteReactSSGOptions } from '../../types'
import type { ViteReactSSGContext as ViteReactSSGTanstackContext } from '../../client/tanstack'
import { getAdapter } from '../router-adapter'
import { createLink, renderHTML } from '../html'
import { joinUrlSegments, stripBase } from '~/utils/path'

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

export function ssrServerPlugin({
  template,
  ssrEntry,
  onBeforePageRender,
  entry,
  rootContainerId,
  onPageRendered,
}: Options): PluginOption {
  return {
    name: 'vite-react-ssg:dev-server',
    configureServer(server) {
      const renderMiddleware: Connect.NextHandleFunction = async (req, res, next) => {
        try {
          const url = req.originalUrl!
          const createRoot: CreateRootFactory = await server.ssrLoadModule(ssrEntry).then(m => m.createRoot)
          const appCtx = await createRoot(false, url) as (ViteReactSSGContext<true> | ViteReactSSGTanstackContext)
          const adapter = getAdapter(appCtx)
          const { app, base } = appCtx
          const searchParams = new URLSearchParams(url.split('?')[1])

          if (!app && searchParams.has('_data')) {
            return adapter.handleLoader(req, res)
          }

          const indexHTML = await server.transformIndexHtml(url, template)
          const transformedIndexHTML = (await onBeforePageRender?.(url, indexHTML, appCtx as any)) || indexHTML

          const { appHTML, bodyAttributes, htmlAttributes, metaAttributes, styleTag }
                    = await adapter.render(stripBase(url, base))

          metaAttributes.push(styleTag)
          const mods = await Promise.all(
            [ssrEntry, entry].map(async entry => await server.moduleGraph.getModuleByUrl(entry)),
          )

          const assetsUrls = new Set<string>()
          const collectedMods = new Set<ModuleNode>()

          const collectAssets = async (mod: ModuleNode | undefined) => {
            if (!mod || !mod?.ssrTransformResult || collectedMods.has(mod))
              return
            collectedMods.add(mod)
            const { deps = [], dynamicDeps = [] } = mod?.ssrTransformResult
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
                const depModule = await server.moduleGraph.getModuleByUrl(dep)
                depModule && await collectAssets(depModule)
              }
            }
          }
          await Promise.all(mods.map(async mod => collectAssets(mod)))
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
}
