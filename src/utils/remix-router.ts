import type { IndexRouteRecord, NonIndexRouteRecord, RouteRecord } from '../types'

type MapRoutePropertiesFunction = (route: RouteRecord) => RouteRecord
export function convertRoutesToDataRoutes(
  routes: RouteRecord[],
  mapRouteProperties: MapRoutePropertiesFunction,
  parentPath: string[] = [],
  // manifest: RouteManifest = {},
): RouteRecord[] {
  return routes.map((route, index) => {
    const treePath = [...parentPath, String(index)]
    const id = typeof route.id === 'string' ? route.id : treePath.join('-')
    route.id = id

    if (isIndexRoute(route)) {
      const indexRoute: IndexRouteRecord = {
        ...route,
        ...mapRouteProperties(route) as IndexRouteRecord,
        id,
      }
      // manifest[id] = indexRoute
      return indexRoute
    }
    else {
      const pathOrLayoutRoute: NonIndexRouteRecord = {
        ...route,
        ...mapRouteProperties(route) as NonIndexRouteRecord,
        id,
        children: undefined,
      }
      // manifest[id] = pathOrLayoutRoute

      if (route.children) {
        pathOrLayoutRoute.children = convertRoutesToDataRoutes(
          route.children,
          mapRouteProperties,
          treePath,
          // manifest,
        )
      }

      return pathOrLayoutRoute
    }
  })
}

function isIndexRoute(
  route: RouteRecord,
): route is IndexRouteRecord {
  return route.index === true
}
