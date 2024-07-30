import type { ViteDevServer } from 'vite'

/**
 * This helper attempts to locate a module in the Vite module graph by reference.
 */
export async function getModuleBySsrReference(vite: ViteDevServer, mod: unknown, moduleUrlAllowList?: Set<string>) {
  for (const value of vite.moduleGraph.idToModuleMap.values()) {
    // only consider modules that are in the allow list
    if (!value.id || (moduleUrlAllowList && !moduleUrlAllowList.has(value.url)))
      continue

    if (!value.ssrModule) {
      await vite.ssrLoadModule(value.id)
    }

    if (value.ssrModule === mod)
      return value.id
  }

  return null
}
