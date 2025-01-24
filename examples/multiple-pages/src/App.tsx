import type { RouteRecord } from 'vite-react-ssg'
import React from 'react'
import './App.css'

const Layout = React.lazy(() => import('./Layout'))

export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: Layout,
    children: [
      {
        path: 'a',
        Component: React.lazy(() => import('./pages/a')),
      },
      {
        index: true,
        Component: React.lazy(() => import('./pages/index')),
      },
      {
        path: 'nest/*',
        lazy: async () => {
          await import('./components/load-comp-1')
          return {
            Component: (await import('./pages/nest/[b]')).Component,
          }
        },
        getStaticPaths: () => ['nest/b1', 'nest/b2'],
      },
    ],
  },
]
