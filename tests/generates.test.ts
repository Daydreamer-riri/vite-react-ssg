import fs from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import fg from 'fast-glob'

describe('multiple-pages', () => {
  it('generates', async () => {
    const files = await fg('**/*.html', {
      cwd: 'examples/multiple-pages/dist',
    })
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
    const files = await fg('**/*.html', {
      cwd: 'examples/lazy-pages/dist',
    })
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
    const files = await fg('**/*.html', {
      cwd: 'examples/single-page/dist',
    })
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
    const files = await fg('**/*.html', {
      cwd: 'examples/with-loader/dist',
    })
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
