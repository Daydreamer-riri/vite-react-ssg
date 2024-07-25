import type { IncomingHttpHeaders, ServerResponse } from 'node:http'
import { once } from 'node:events'
import { Readable } from 'node:stream'
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
// Adapted from solid-start's `handleNodeResponse`:
// https://github.com/solidjs/solid-start/blob/7398163869b489cce503c167e284891cf51a6613/packages/start/node/fetch.js#L162-L185
export async function toNodeRequest(res: Response, nodeRes: ServerResponse) {
  nodeRes.statusCode = res.status
  nodeRes.statusMessage = res.statusText

  // const cookiesStrings = []

  for (const [name, value] of res.headers) {
    // if (name === 'set-cookie') {
    //   cookiesStrings.push(...splitCookiesString(value))
    // }
    // else {
    nodeRes.setHeader(name, value)
    // }
  }

  // if (cookiesStrings.length) {
  //   nodeRes.setHeader('set-cookie', cookiesStrings)
  // }

  if (res.body) {
    // https://github.com/microsoft/TypeScript/issues/29867
    const responseBody = res.body as unknown as AsyncIterable<Uint8Array>
    const readable = Readable.from(responseBody)
    readable.pipe(nodeRes)
    await once(readable, 'end')
  }
  else {
    nodeRes.end()
  }
}
