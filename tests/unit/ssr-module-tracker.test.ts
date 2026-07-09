import type { Plugin } from 'vite'
import { parseAst } from 'vite'
import { describe, expect, it } from 'vitest'
import { createSsrModuleTrackingPlugin, SsrModuleTracker } from '../../src/node/ssr-module-tracker'

const ROOT = '/project'
const TRACK_KEY = '__VITE_REACT_SSG_TRACK_SSR_MODULE__'

interface ResolveEntry {
  from: string
  to: string | null
}

type TrackerGlobal = typeof globalThis & { [TRACK_KEY]?: (id: string) => void }

function trackerHook(): ((id: string) => void) | undefined {
  return (globalThis as TrackerGlobal)[TRACK_KEY]
}

function getTransform(plugin: Plugin) {
  const hook = plugin.transform
  if (typeof hook === 'function')
    return hook
  if (hook && typeof hook === 'object' && 'handler' in hook && typeof hook.handler === 'function')
    return hook.handler
  throw new Error('Expected plugin.transform to be a function')
}

async function transformSource(
  plugin: Plugin,
  code: string,
  id: string,
  resolves: ResolveEntry[] = [],
) {
  const ctx = {
    parse: (input: string) => parseAst(input),
    resolve: async (source: string) => {
      const match = resolves.find(entry => entry.from === source)
      if (!match)
        return null
      return match.to ? { id: match.to } : null
    },
  }
  const transform = getTransform(plugin)
  return await (transform as (this: unknown, code: string, id: string, opts: unknown) => unknown)
    .call(ctx, code, id, {})
}

describe('ssrModuleTracker', () => {
  it('records module ids added inside a tracked render', async () => {
    const tracker = new SsrModuleTracker()
    tracker.install()
    try {
      const { moduleIds, result } = await tracker.track(async () => {
        trackerHook()?.('src/pages/a.tsx')
        trackerHook()?.('src/pages/deep.tsx')
        return 'ok'
      })
      expect(result).toBe('ok')
      expect([...moduleIds].sort()).toEqual(['src/pages/a.tsx', 'src/pages/deep.tsx'])
    }
    finally {
      tracker.uninstall()
    }
  })

  it('isolates module ids across concurrent renders', async () => {
    const tracker = new SsrModuleTracker()
    tracker.install()
    try {
      const [a, b] = await Promise.all([
        tracker.track(async () => {
          await Promise.resolve()
          trackerHook()?.('a')
        }),
        tracker.track(async () => {
          await Promise.resolve()
          trackerHook()?.('b')
        }),
      ])
      expect([...a.moduleIds]).toEqual(['a'])
      expect([...b.moduleIds]).toEqual(['b'])
    }
    finally {
      tracker.uninstall()
    }
  })

  it('is a no-op when uninstalled', async () => {
    const tracker = new SsrModuleTracker()
    expect(trackerHook()).toBeUndefined()
    const { moduleIds } = await tracker.track(async () => {
      trackerHook()?.('never-tracked')
    })
    expect([...moduleIds]).toEqual([])
  })

  it('removes the global hook on uninstall', () => {
    const tracker = new SsrModuleTracker()
    tracker.install()
    expect(typeof trackerHook()).toBe('function')
    tracker.uninstall()
    expect(trackerHook()).toBeUndefined()
  })
})

describe('createSsrModuleTrackingPlugin', () => {
  const plugin = createSsrModuleTrackingPlugin(ROOT) as Plugin

  it('does not transform files outside the root', async () => {
    const result = await transformSource(plugin, 'const a = 1', '/other/place/x.ts')
    expect(result).toBeNull()
  })

  it('does not transform files inside node_modules', async () => {
    const result = await transformSource(plugin, 'const a = 1', `${ROOT}/node_modules/pkg/index.js`)
    expect(result).toBeNull()
  })

  it('does not transform non-JS/TS sources', async () => {
    const result = await transformSource(plugin, '.a { color: red }', `${ROOT}/src/x.css`)
    expect(result).toBeNull()
  })

  it('injects a top-level tracker call using the manifest-style id', async () => {
    const result = await transformSource(plugin, 'export const x = 1', `${ROOT}/src/pages/a.tsx`)
    const code = (result as { code: string }).code
    expect(code.startsWith(`globalThis.${TRACK_KEY}?.("src/pages/a.tsx");\n`)).toBe(true)
    expect(code).toContain('export const x = 1')
  })

  it('wraps dynamic imports whose target is trackable', async () => {
    const code = `const load = () => import('./deep')`
    const result = await transformSource(plugin, code, `${ROOT}/src/pages/a.tsx`, [
      { from: './deep', to: `${ROOT}/src/pages/deep.tsx` },
    ])
    const out = (result as { code: string }).code
    expect(out).toContain(`(globalThis.${TRACK_KEY}?.("src/pages/deep.tsx"), import('./deep'))`)
  })

  const wrappedPattern = new RegExp(`\\(globalThis\\.${TRACK_KEY}\\?\\.\\([^)]+\\),\\s*import\\(`)

  it('does not wrap dynamic imports resolving into node_modules', async () => {
    const code = `const load = () => import('some-pkg')`
    const result = await transformSource(plugin, code, `${ROOT}/src/pages/a.tsx`, [
      { from: 'some-pkg', to: `${ROOT}/node_modules/some-pkg/index.js` },
    ])
    const out = (result as { code: string }).code
    expect(out).toContain(`import('some-pkg')`)
    expect(out).not.toMatch(wrappedPattern)
  })

  it('does not wrap dynamic imports that fail to resolve', async () => {
    const code = `const load = () => import('./missing')`
    const result = await transformSource(plugin, code, `${ROOT}/src/pages/a.tsx`, [])
    const out = (result as { code: string }).code
    expect(out).toContain(`import('./missing')`)
    expect(out).not.toMatch(wrappedPattern)
  })

  it('leaves dynamic imports with non-literal sources alone', async () => {
    const code = `const load = (name) => import(name)`
    const result = await transformSource(plugin, code, `${ROOT}/src/pages/a.tsx`)
    const out = (result as { code: string }).code
    expect(out).toContain('import(name)')
    expect(out).not.toMatch(wrappedPattern)
  })

  it('wraps multiple dynamic imports independently', async () => {
    const code = [
      `const a = () => import('./a')`,
      `const b = () => import('./b')`,
    ].join('\n')
    const result = await transformSource(plugin, code, `${ROOT}/src/pages/root.tsx`, [
      { from: './a', to: `${ROOT}/src/pages/a.tsx` },
      { from: './b', to: `${ROOT}/src/pages/b.tsx` },
    ])
    const out = (result as { code: string }).code
    expect(out).toContain(`(globalThis.${TRACK_KEY}?.("src/pages/a.tsx"), import('./a'))`)
    expect(out).toContain(`(globalThis.${TRACK_KEY}?.("src/pages/b.tsx"), import('./b'))`)
  })
})
