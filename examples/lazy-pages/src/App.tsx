import type { RouteRecord } from 'vite-react-ssg'
import React from 'react'
import './App.css'

const Layout = React.lazy(() => import('./Layout'))

export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: Layout,
    HydrateFallback: Layout,
    children: [
      {
        path: 'a',
        lazy: () => import('./pages/a'),
      },
      {
        index: true,
        lazy: () => defaultToComponent(import('./pages/index')),
      },
      {
        path: 'nest/:b',
        lazy: () => defaultToComponent(import('./pages/nest/[b]')),
      },
    ],
  },
]

async function defaultToComponent(routePromise: Promise<RouteRecord & { default: any }>) {
  const routeModule = await routePromise

  return { ...routeModule, Component: routeModule.default }
}
