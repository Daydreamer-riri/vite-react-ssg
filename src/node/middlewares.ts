import type { NextFunction, Request, Response } from 'express'
import { cleanUrl, joinUrlSegments, withTrailingSlash } from './utils'

export function baseMiddleware(rawBase: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const url = req.url!
    const pathname = cleanUrl(url)
    const base = rawBase

    if (pathname.startsWith(base))
      return next()

    if (pathname === '/' || pathname === '/index.html') {
      // redirect root visit to based url with search and hash
      res.writeHead(302, {
        Location: base + url.slice(pathname.length),
      })
      res.end()
      return
    }

    // non-based page visit
    const redirectPath
      = withTrailingSlash(url) !== base ? joinUrlSegments(base, url) : base
    if (req.headers.accept?.includes('text/html')) {
      res.writeHead(404, {
        'Content-Type': 'text/html',
      })
      res.end(
        `The server is configured with a public base URL of ${base} - `
        + `did you mean to visit <a href="${redirectPath}">${redirectPath}</a> instead?`,
      )
    }
    else {
      // not found for resources
      res.writeHead(404, {
        'Content-Type': 'text/plain',
      })
      res.end(
        `The server is configured with a public base URL of ${base} - `
        + `did you mean to visit ${redirectPath} instead?`,
      )
    }
  }
}
