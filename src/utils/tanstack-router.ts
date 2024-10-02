import type { RootRoute, Route } from '@tanstack/react-router'
import type { RouteRecord } from '../types'

export const ViteReactSSGTanstackRouterStaticPathsContext: any = {}

export function registerPaths(id: string, getStaticPaths: () => string[] | Promise<string[]>) {
  ViteReactSSGTanstackRouterStaticPathsContext[id] = getStaticPaths
}

export async function convertRouteTreeToRouteOption(routeTree: RootRoute, client: boolean): Promise<RouteRecord[]> {
  const routes: RouteRecord[] = []

  async function traverseRouteTree(node: RootRoute | Route) {
    if (!client && node.path.includes('$') && node.lazyFn) {
      await node.lazyFn()
    }

    const routeRecord: RouteRecord = {
      path: node.path,
      getStaticPaths: ViteReactSSGTanstackRouterStaticPathsContext[node.id],
    }

    routeRecord.path = routeRecord.path?.replaceAll('$', ':')

    const children = node.children as Record<string, Route> | undefined

    if (children) {
      routeRecord.children = []
      for (const child of Object.values(children)) {
        routeRecord.children!.push(await traverseRouteTree(child))
      }
    }

    return routeRecord
  }

  routes.push(await traverseRouteTree(routeTree))
  return routes
}

export const META_CONTAINER_ID = '__SSG_TANSTACK_META_CONTAINER__'
