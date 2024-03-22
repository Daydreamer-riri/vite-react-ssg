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
        Component: React.lazy(() => import('./pages/a')),
        entry: 'src/pages/a.tsx',
      },
      {
        index: true,
        Component: React.lazy(() => import('./pages/index')),
        entry: 'src/pages/index.tsx',
      },
      {
        path: 'nest/*',
        Component: React.lazy(() => import('./pages/nest/[b]')),
        entry: 'src/pages/nest/[b].tsx',
        getStaticPaths: () => ['nest/b1', 'nest/b2'],
      },
    ],
    entry: 'src/Layout.tsx',
  },
]
