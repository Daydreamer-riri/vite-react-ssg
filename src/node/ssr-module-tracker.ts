import type { PluginOption } from 'vite'
import { AsyncLocalStorage } from 'node:async_hooks'
import { isAbsolute, relative } from 'node:path'
import { normalizePath } from 'vite'
import { cleanUrl } from './utils'

type TrackModule = (id: string) => void
type AstNode = Record<string, unknown> & {
  end?: number
  source?: AstNode & { value?: unknown }
  start?: number
  type?: string
}

const trackModuleGlobal = '__VITE_REACT_SSG_TRACK_SSR_MODULE__'

type SsrModuleGlobal = typeof globalThis & {
  [trackModuleGlobal]?: TrackModule
}

export class SsrModuleTracker {
  private moduleIds = new AsyncLocalStorage<Set<string>>()

  install(): void {
    const globalObject = globalThis as SsrModuleGlobal
    globalObject[trackModuleGlobal] = id => {
      this.moduleIds.getStore()?.add(id)
    }
  }

  uninstall(): void {
    const globalObject = globalThis as SsrModuleGlobal
    delete globalObject[trackModuleGlobal]
  }

  async track<T>(render: () => Promise<T>): Promise<{
    moduleIds: Set<string>
    result: T
  }> {
    const moduleIds = new Set<string>()
    const result = await this.moduleIds.run(moduleIds, render)

    return {
      moduleIds,
      result,
    }
  }
}

export function createSsrModuleTrackingPlugin(root: string): PluginOption {
  return {
    name: 'vite-react-ssg:ssr-module-tracking',
    apply: 'build',
    enforce: 'post',
    async transform(code, id) {
      if (!isTrackableSource(id, root))
        return null

      const moduleId = toManifestId(id, root)
      const dynamicImports = await findStaticDynamicImports.call(this, code, id, root)
      let transformed = code

      for (const dynamicImport of dynamicImports.reverse()) {
        transformed = `${transformed.slice(0, dynamicImport.start)}(globalThis.${trackModuleGlobal}?.(${JSON.stringify(dynamicImport.moduleId)}), ${transformed.slice(dynamicImport.start, dynamicImport.end)})${transformed.slice(dynamicImport.end)}`
      }

      return {
        code: `globalThis.${trackModuleGlobal}?.(${JSON.stringify(moduleId)});\n${transformed}`,
        map: null,
      }
    },
  }

  async function findStaticDynamicImports(
    this: {
      parse: (code: string) => unknown
      resolve: (id: string, importer?: string, options?: { skipSelf?: boolean }) => Promise<{ id: string } | null>
    },
    code: string,
    importer: string,
    root: string,
  ) {
    const ast = this.parse(code)
    const imports: Array<{
      start: number
      end: number
      moduleId: string
    }> = []

    await walk(ast, async node => {
      if (node.type !== 'ImportExpression')
        return

      const source = node.source
      if (!source || source.type !== 'Literal' || typeof source.value !== 'string')
        return

      const resolved = await this.resolve(source.value, importer, { skipSelf: true })
      if (!resolved || !isTrackableSource(resolved.id, root))
        return

      imports.push({
        start: node.start!,
        end: node.end!,
        moduleId: toManifestId(resolved.id, root),
      })
    })

    return imports
  }
}

async function walk(
  node: unknown,
  visit: (node: AstNode) => Promise<void>,
): Promise<void> {
  if (!node || typeof node !== 'object')
    return

  await visit(node as AstNode)

  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent')
      continue

    if (Array.isArray(value)) {
      for (const item of value)
        await walk(item, visit)
    }
    else if (value && typeof value === 'object' && typeof (value as AstNode).type === 'string') {
      await walk(value, visit)
    }
  }
}

function isTrackableSource(id: string, root: string) {
  const cleanId = cleanUrl(id)

  return isSupportedSource(cleanId)
    && isInsideRoot(cleanId, root)
    && !cleanId.includes('/node_modules/')
}

function isSupportedSource(id: string) {
  return /\.[cm]?[jt]sx?$/.test(id)
}

function isInsideRoot(id: string, root: string) {
  return isAbsolute(id) && !relative(root, id).startsWith('..')
}

function toManifestId(id: string, root: string) {
  return normalizePath(relative(root, cleanUrl(id)))
}
