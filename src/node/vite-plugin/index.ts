import type { Connect, PluginOption, ViteDevServer } from 'vite'
import type { CreateRootFactory } from '../build'
import type { ViteReactSSGContext, ViteReactSSGOptions } from '../../types'
import { createRemixSSRHandler } from './remix-ssr-server'

export interface Options extends ViteReactSSGOptions {
  template: string
  ssrEntry: string
  entry: string
  rootContainerId: string
}

export interface HandlerCreaterOptions extends Options {
  server: ViteDevServer
  ssgContext: ViteReactSSGContext
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
          const appCtx = await createRoot(false, url) as ViteReactSSGContext<true>
          const { routerType } = appCtx
          if (routerType !== 'tanstack') {
            const hander = createRemixSSRHandler({
              template,
              ssgContext: appCtx,
              ssrEntry,
              onBeforePageRender,
              entry,
              rootContainerId,
              onPageRendered,
              server,
            })
            hander(req, res, next)
          }
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
