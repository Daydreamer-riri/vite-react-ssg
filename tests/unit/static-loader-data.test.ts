import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchStaticLoaderData, loadDocument } from '../../src/utils/static-loader-data'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(response: Response) {
  const fetch = vi.fn(async () => response)
  vi.stubGlobal('fetch', fetch)
  return fetch
}

describe('fetchStaticLoaderData', () => {
  it('returns parsed JSON', async () => {
    const fetch = stubFetch(Response.json({ '/a': 'static-loader-data/a.hash.json' }))
    await expect(fetchStaticLoaderData('/manifest.json')).resolves.toEqual({
      '/a': 'static-loader-data/a.hash.json',
    })
    expect(fetch).toHaveBeenCalledWith('/manifest.json')
  })

  // https://github.com/Daydreamer-riri/vite-react-ssg/issues/93
  it('returns undefined when the host answers with a 404 page', async () => {
    stubFetch(new Response('<!DOCTYPE html><title>404</title>', {
      status: 404,
      headers: { 'content-type': 'text/html' },
    }))
    await expect(fetchStaticLoaderData('/manifest.json')).resolves.toBeUndefined()
  })

  it('returns undefined when an SPA fallback serves HTML with status 200', async () => {
    stubFetch(new Response('<!DOCTYPE html><div id="root"></div>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }))
    await expect(fetchStaticLoaderData('/manifest.json')).resolves.toBeUndefined()
  })

  it('does not swallow network errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    }))
    await expect(fetchStaticLoaderData('/manifest.json')).rejects.toThrow('Failed to fetch')
  })
})

describe('loadDocument', () => {
  function createLocation(href: string) {
    return { href, assign: vi.fn() }
  }

  it('loads the target URL as a new document and stays pending', async () => {
    const location = createLocation('https://example.com/a')
    const result = loadDocument('https://example.com/b?x=1', location)
    expect(location.assign).toHaveBeenCalledWith('https://example.com/b?x=1')

    const settled = await Promise.race([
      result.then(() => 'settled', () => 'settled'),
      new Promise(resolve => setTimeout(resolve, 10, 'pending')),
    ])
    expect(settled).toBe('pending')
  })

  it('throws instead of reloading the current document', () => {
    const location = createLocation('https://example.com/a?x=1#top')
    expect(() => loadDocument('https://example.com/a?x=1', location)).toThrow(
      '[vite-react-ssg] Static loader data for https://example.com/a?x=1 is not available.',
    )
    expect(location.assign).not.toHaveBeenCalled()
  })

  it('still loads a different search of the same path', () => {
    const location = createLocation('https://example.com/a?x=1')
    void loadDocument('https://example.com/a?x=2', location)
    expect(location.assign).toHaveBeenCalledWith('https://example.com/a?x=2')
  })
})
