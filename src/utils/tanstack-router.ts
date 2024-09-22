import type { RootRoute, Route } from '@tanstack/react-router'
import type { RouteRecord } from '../types'

export function convertRouteTreeToRouteOption(routeTree: RootRoute): RouteRecord[] {
  const routes: RouteRecord[] = []

  function traverseRouteTree(node: RootRoute | Route): void {
    const routeRecord: RouteRecord = {
      path: node.path,
    }

    const children = node.children as Record<string, Route> | undefined

    if (children) {
      routeRecord.children = []
      Object.values(children).forEach(child => {
        traverseRouteTree(child)
        routeRecord.children!.push({
          path: child.path,
        })
      })
    }

    routes.push(routeRecord)
  }

  traverseRouteTree(routeTree)
  return routes
}

export const META_CONTAINER_ID = '__SSG_TANSTACK_META_CONTAINER__'
