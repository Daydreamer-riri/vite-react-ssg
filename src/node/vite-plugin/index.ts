import type { Connect, PluginOption, ViteDevServer } from 'vite'
import type { CreateRootFactory } from '../build'
import type { ViteReactSSGContext, ViteReactSSGOptions } from '../../types'
import type { ViteReactSSGContext as ViteReactSSGTanstackContext } from '../../client/tanstack'
import { distingushContext } from '../../utils/routerHandler'
import { createRemixSSRHandler } from './remix-ssr-server'
import { createTanstackSSRHandler } from './tanstack-ssr-server'

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
          const { routerType, context } = distingushContext(appCtx)
          const handlerOptions = {
            template,
            ssrEntry,
            onBeforePageRender,
            entry,
            rootContainerId,
            onPageRendered,
            server,
          }
          switch (routerType) {
            case 'tanstack': {
              const handler = createTanstackSSRHandler({
                ...handlerOptions,
                ssgContext: context,
              } as HandlerCreaterOptions<ViteReactSSGTanstackContext>)
              handler(req, res, next)
              break
            }
            default: {
              const hander = createRemixSSRHandler({
                ...handlerOptions,
                ssgContext: context,
              })
              hander(req, res, next)
              break
            }
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
