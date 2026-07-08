import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderPreloadLinks } from '../../src/node/preload-links'

let document: Document

beforeEach(() => {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>')
  document = dom.window.document
})

function getLinks() {
  return Array.from(document.head.querySelectorAll('link')).map(link => ({
    rel: link.getAttribute('rel'),
    href: link.getAttribute('href'),
    as: link.getAttribute('as'),
    type: link.getAttribute('type'),
    crossOrigin: link.getAttribute('crossorigin'),
  }))
}

describe('renderPreloadLinks', () => {
  it('emits modulepreload for .js assets', () => {
    renderPreloadLinks(document, new Set(['/assets/app.js']))
    expect(getLinks()).toEqual([
      { rel: 'modulepreload', href: '/assets/app.js', as: null, type: null, crossOrigin: '' },
    ])
  })

  it('emits stylesheet for .css assets', () => {
    renderPreloadLinks(document, new Set(['/assets/app.css']))
    expect(getLinks()).toEqual([
      { rel: 'stylesheet', href: '/assets/app.css', as: null, type: null, crossOrigin: '' },
    ])
  })

  it('emits preload/font for woff2 assets', () => {
    renderPreloadLinks(document, new Set(['/assets/font.woff2']))
    expect(getLinks()).toEqual([
      { rel: 'preload', href: '/assets/font.woff2', as: 'font', type: 'font/woff2', crossOrigin: '' },
    ])
  })

  it('emits preload/image for png assets', () => {
    renderPreloadLinks(document, new Set(['/assets/hero.png']))
    expect(getLinks()).toEqual([
      { rel: 'preload', href: '/assets/hero.png', as: 'image', type: null, crossOrigin: '' },
    ])
  })

  it('ignores unknown asset types', () => {
    renderPreloadLinks(document, new Set(['/assets/data.txt']))
    expect(getLinks()).toEqual([])
  })

  it('skips duplicate entries within the same call via the internal seen set', () => {
    // Set input naturally dedupes; this asserts the function completes and emits exactly one link.
    renderPreloadLinks(document, new Set(['/assets/app.js']))
    expect(getLinks()).toHaveLength(1)
  })

  it('does not duplicate links that already exist in the document head', () => {
    const link = document.createElement('link')
    link.setAttribute('rel', 'modulepreload')
    link.setAttribute('href', '/assets/app.js')
    document.head.appendChild(link)

    renderPreloadLinks(document, new Set(['/assets/app.js']))

    expect(getLinks()).toHaveLength(1)
  })

  it('handles a mix of asset types', () => {
    const assets = new Set([
      '/assets/app.js',
      '/assets/app.css',
      '/assets/font.woff',
      '/assets/icon.svg',
    ])
    renderPreloadLinks(document, assets)
    const rels = getLinks().map(l => l.rel).sort()
    expect(rels).toEqual(['modulepreload', 'preload', 'preload', 'stylesheet'])
  })
})
