import type { IncomingHttpHeaders, ServerResponse } from 'node:http'
import type * as Vite from 'vite'

import invariant from '../invariant'

export type NodeRequestHandler = (
  req: Vite.Connect.IncomingMessage,
  res: ServerResponse
) => Promise<void>

function fromNodeHeaders(nodeHeaders: IncomingHttpHeaders): Headers {
  const headers = new Headers()

  for (const [key, values] of Object.entries(nodeHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values)
          headers.append(key, value)
      }
      else {
        headers.set(key, values)
      }
    }
  }

  return headers
}

// Based on `createRemixRequest` in packages/remix-express/server.ts
export function fromNodeRequest(
  nodeReq: Vite.Connect.IncomingMessage,
): Request {
  const origin
    = nodeReq.headers.origin && nodeReq.headers.origin !== 'null'
      ? nodeReq.headers.origin
      : `http://${nodeReq.headers.host}`
  // Use `req.originalUrl` so Remix is aware of the full path
  invariant(
    nodeReq.originalUrl,
    'Expected `nodeReq.originalUrl` to be defined',
  )
  const url = new URL(nodeReq.originalUrl, origin)
  const init: RequestInit = {
    method: nodeReq.method,
    headers: fromNodeHeaders(nodeReq.headers),
  }

  // if (nodeReq.method !== 'GET' && nodeReq.method !== 'HEAD') {
  //   init.body = createReadableStreamFromReadable(nodeReq);
  //   (init as { duplex: 'half' }).duplex = 'half'
  // }

  return new Request(url.href, init)
}
