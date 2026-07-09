import fs from 'node:fs/promises'
import fg from 'fast-glob'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

async function findGeneratedHtml(cwd: string) {
  const files = await fg('**/*.html', {
    cwd,
  })
  return files.sort((a, b) => {
    const depth = a.split('/').length - b.split('/').length
    return depth || a.localeCompare(b)
  })
}

describe('multiple-pages', () => {
  it('generates', async () => {
    const files = await findGeneratedHtml('examples/multiple-pages/dist')
    expect(files).toMatchInlineSnapshot(`
      [
        "a.html",
        "index.html",
        "nest/b1.html",
        "nest/b2.html",
      ]
    `)
  })

  it('generates a.html', async () => {
    const file = await fs.readFile('examples/multiple-pages/dist/a.html', 'utf-8')
    expect(file).toContain('Page A')
  })
})

describe('lazy-pages', () => {
  it('generates', async () => {
    const files = await findGeneratedHtml('examples/lazy-pages/dist')
    expect(files).toMatchInlineSnapshot(`
      [
        "a.html",
        "index.html",
        "nest/b1.html",
        "nest/b2.html",
      ]
    `)
  })

  it('lazy-content', async () => {
    const fileB1 = await fs.readFile('examples/lazy-pages/dist/nest/b1.html', 'utf-8')
    expect(fileB1).toContain('<div>b1</div>')
    const fileB2 = await fs.readFile('examples/lazy-pages/dist/nest/b2.html', 'utf-8')
    expect(fileB2).toContain('<div>b2</div>')
  })
})

describe('element-lazy-assets', () => {
  it('links css for element lazy routes without route entry', async () => {
    await expectElementLazyAssets('examples/element-lazy-assets/dist')
  })

  it('links css for element lazy routes with Vite 6', async () => {
    await expectElementLazyAssets('examples/element-lazy-assets-v6/dist')
  })

  it('links css for element lazy routes with Vite 7', async () => {
    await expectElementLazyAssets('examples/element-lazy-assets-v7/dist')
  })
})

interface AssetManifestItem {
  file: string
  css?: string[]
}

async function expectElementLazyAssets(cwd: string) {
  const manifest: Record<string, AssetManifestItem> = JSON.parse(
    await fs.readFile(`${cwd}/.vite/manifest.json`, 'utf-8'),
  )
  const cssFor = (src: string) => {
    const entry = manifest[src]
    if (!entry?.css?.length)
      throw new Error(`Expected manifest entry ${src} to declare css`)
    return entry.css.map(file => `/${file}`)
  }

  const pageACss = cssFor('src/pages/a.tsx')
  const pageBCss = cssFor('src/pages/b.tsx')
  const pageCCss = cssFor('src/pages/c.tsx')

  const pageALinks = await stylesheets(`${cwd}/a.html`)
  const pageBLinks = await stylesheets(`${cwd}/b.html`)
  const pageCLinks = await stylesheets(`${cwd}/c.html`)
  const sharedLinks = pageALinks
    .filter(href => pageBLinks.includes(href))
    .filter(href => pageCLinks.includes(href))

  expect(sharedLinks.length).toBeGreaterThan(0)
  expect(new Set(pageALinks)).toEqual(new Set([...pageACss, ...sharedLinks]))
  expect(new Set(pageBLinks)).toEqual(new Set([...pageBCss, ...sharedLinks]))
  expect(new Set(pageCLinks)).toEqual(new Set([...pageCCss, ...sharedLinks]))
  for (const [own, others] of [
    [pageALinks, [pageBCss, pageCCss]],
    [pageBLinks, [pageACss, pageCCss]],
    [pageCLinks, [pageACss, pageBCss]],
  ] as const) {
    for (const foreign of others)
      expect(own).not.toEqual(expect.arrayContaining(foreign))
  }
}

async function stylesheets(path: string) {
  const html = await fs.readFile(path, 'utf-8')
  const doc = new JSDOM(html).window.document
  return Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
    .map(link => link.getAttribute('href'))
    .filter((href): href is string => href !== null)
}

describe('single-page', () => {
  it('generates', async () => {
    const files = await findGeneratedHtml('examples/single-page/dist')
    expect(files).toMatchInlineSnapshot(`
      [
        "index.html",
      ]
    `)
  })

  it('index-content', async () => {
    const index = await fs.readFile('examples/single-page/dist/index.html', 'utf-8')
    expect(index).toContain('<h2>vite-react-ssg single-page</h2>')
  })
})

describe('with-loader', () => {
  it('generates', async () => {
    const files = await findGeneratedHtml('examples/with-loader/dist')
    expect(files).toMatchInlineSnapshot(`
      [
        "index.html",
        "json.html",
        "docs/a.html",
        "docs/b.html",
      ]
    `)
  })

  it('docs-content', async () => {
    const index = await fs.readFile('examples/with-loader/dist/docs/a.html', 'utf-8')
    expect(index).toContain('<li>A</li>')
  })
})

describe('auto-pages', () => {
  it('generates', async () => {
    const files = await findGeneratedHtml('examples/auto-pages/dist')
    expect(files).toMatchInlineSnapshot(`
      [
        "a.html",
        "index.html",
        "nest.html",
      ]
    `)
  })

  it('renders the index page', async () => {
    const index = await fs.readFile('examples/auto-pages/dist/index.html', 'utf-8')
    expect(index).toContain('Vite + React')
  })
})

describe('styled-components', () => {
  it('generates', async () => {
    const files = await findGeneratedHtml('examples/styled-components/dist')
    expect(files).toMatchInlineSnapshot(`
      [
        "a.html",
        "index.html",
      ]
    `)
  })

  it('injects styled-components collected styles into head', async () => {
    const index = await fs.readFile('examples/styled-components/dist/index.html', 'utf-8')
    expect(index).toContain('data-styled')
    expect(index).toContain('data-styled-version')
  })
})

describe('with-i18n', () => {
  it('generates localized routes', async () => {
    const files = await findGeneratedHtml('examples/with-i18n/dist')
    expect(files).toMatchInlineSnapshot(`
      [
        "en.html",
        "index.html",
        "zh.html",
        "en/a.html",
        "zh/a.html",
        "en/nest/b1.html",
        "en/nest/b2.html",
        "zh/nest/b1.html",
        "zh/nest/b2.html",
      ]
    `)
  })

  it('renders localized content per locale', async () => {
    const en = await fs.readFile('examples/with-i18n/dist/en.html', 'utf-8')
    const zh = await fs.readFile('examples/with-i18n/dist/zh.html', 'utf-8')
    expect(en).toContain('Layout')
    expect(zh).toContain('布局')
  })
})

describe('with-scss', () => {
  it('generates', async () => {
    const files = await findGeneratedHtml('examples/with-scss/dist')
    expect(files).toMatchInlineSnapshot(`
      [
        "a.html",
        "index.html",
        "nest/b1.html",
        "nest/b2.html",
      ]
    `)
  })

  it('links the compiled scss stylesheet', async () => {
    const index = await fs.readFile('examples/with-scss/dist/index.html', 'utf-8')
    expect(index).toMatch(/<link[^>]*rel="stylesheet"[^>]*href="[^"]+\.css"/)
    const cssFiles = await fg('assets/*.css', {
      cwd: 'examples/with-scss/dist',
    })
    expect(cssFiles.length).toBeGreaterThan(0)
  })
})
