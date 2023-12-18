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
    const file = await fs.readFile('examples/lazy-pages/dist/nest/b1.html', 'utf-8')
    expect(file).toContain('<div>B</div>')
  })
})
