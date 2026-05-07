import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createLink, detectEntry, renderHTML } from '../../src/node/html'

const baseArgs = {
  rootContainerId: 'root',
  bodyAttributes: 'data-theme="light"',
  htmlAttributes: 'lang="en"',
  metaAttributes: ['<meta name="foo" content="bar">'],
}

describe('createLink', () => {
  it('produces a stylesheet link tag', () => {
    expect(createLink('/assets/app.css')).toBe(
      '<link rel="stylesheet" href="/assets/app.css">',
    )
  })
})

describe('renderHTML', () => {
  const indexHTML = '<html><head></head><body><div id="root"></div></body></html>'

  it('injects meta, html/body attributes and server-rendered content into the root container', async () => {
    const out = await renderHTML({
      ...baseArgs,
      indexHTML,
      appHTML: '<main>hi</main>',
      initialState: null,
    })
    expect(out).toContain('<meta name="foo" content="bar">')
    expect(out).toContain('<html lang="en"')
    expect(out).toContain('<body data-theme="light"')
    expect(out).toContain('<div id="root" data-server-rendered="true"><main>hi</main></div>')
    // no initial-state script when state is null
    expect(out).not.toContain('__INITIAL_STATE__')
  })

  it('embeds window.__INITIAL_STATE__ when initialState is provided', async () => {
    const out = await renderHTML({
      ...baseArgs,
      indexHTML,
      appHTML: '<main>hi</main>',
      initialState: '"{\\"a\\":1}"',
    })
    expect(out).toContain('window.__INITIAL_STATE__="{\\"a\\":1}"')
  })

  it('falls back to html5parser when the container is not a div', async () => {
    const customContainer = '<html><head></head><body><main id="root" class="app"></main></body></html>'
    const out = await renderHTML({
      ...baseArgs,
      indexHTML: customContainer,
      appHTML: '<p>x</p>',
      initialState: null,
    })
    expect(out).toContain('<main id="root" class="app" data-server-rendered="true"><p>x</p></main>')
  })

  it('throws when no element with the root container id is found', async () => {
    await expect(
      renderHTML({
        ...baseArgs,
        indexHTML: '<html><head></head><body></body></html>',
        appHTML: '<p>x</p>',
        initialState: null,
      }),
    ).rejects.toThrow(/root/)
  })
})

describe('detectEntry', () => {
  let tmp: string

  beforeAll(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'vrs-html-'))
  })

  afterAll(async () => {
    await rm(tmp, { recursive: true, force: true })
  })

  it('returns the first module script src', async () => {
    const html = `<!doctype html>
<html><body>
<script src="/legacy.js"></script>
<script type="module" src="/src/main.tsx"></script>
</body></html>`
    await writeFile(join(tmp, 'index.html'), html, 'utf-8')
    expect(await detectEntry(tmp, 'index.html')).toBe('/src/main.tsx')
  })

  it('falls back to src/main.ts when no module script is found', async () => {
    const html = '<!doctype html><html><body></body></html>'
    await writeFile(join(tmp, 'empty.html'), html, 'utf-8')
    expect(await detectEntry(tmp, 'empty.html')).toBe('src/main.ts')
  })
})
