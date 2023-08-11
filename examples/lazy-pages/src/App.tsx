import React from 'react'
import type { RouteRecord } from 'vite-react-ssg'
import './App.css'

const Layout = React.lazy(() => import('./Layout'))

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'a',
        lazy: () => import('./pages/a'),
        entry: 'src/pages/a.tsx',
      },
      {
        index: true,
        lazy: () => import('./pages/index'),
        entry: 'src/pages/index.tsx',
      },
      {
        path: 'nest/:b',
        lazy: () => import('./pages/nest/[b]'),
      },
    ],
    entry: 'src/Layout.tsx',
  },
]
