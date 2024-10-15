import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect } from 'vite'

export interface IRouterAdapter<Context> {
  context: Context
  render: (path: string) => Promise<RenderResult>
  handleLoader: (
    req: Connect.IncomingMessage,
    res: ServerResponse<IncomingMessage>,
  ) => void
}

export interface RenderResult {
  appHTML: string
  htmlAttributes: string
  bodyAttributes: string
  metaAttributes: string[]
  styleTag: string
  routerContext: { loaderData: unknown }
}
