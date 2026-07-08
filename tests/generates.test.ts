import fs from 'node:fs/promises'
import fg from 'fast-glob'
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
