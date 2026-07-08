import type { ReactNode } from 'react'
import type { RouteRecord } from 'vite-react-ssg'
import React, { Suspense } from 'react'
import { ViteReactSSG } from 'vite-react-ssg'
import Layout from './Layout'

const PageA = React.lazy(() => import('./pages/a'))
const PageB = React.lazy(() => import('./pages/b'))

function suspense(element: ReactNode): ReactNode {
  return (
    <Suspense fallback={null}>
      {element}
    </Suspense>
  )
}

export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: Layout,
    children: [
      {
        path: 'a',
        element: suspense(<PageA />),
        entry: 'src/pages/a.tsx',
      },
      {
        path: 'b',
        element: suspense(<PageB />),
        entry: 'src/pages/b.tsx',
      },
    ],
  },
]

export const createRoot = ViteReactSSG({ routes })
