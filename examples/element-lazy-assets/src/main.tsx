import type { ReactNode } from 'react'
import type { RouteRecord } from 'vite-react-ssg'
import React, { Suspense } from 'react'
import { ViteReactSSG } from 'vite-react-ssg'
import Layout from './Layout'
import { LazyPageC } from './lazy-components'

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
      },
      {
        path: 'b',
        element: suspense(<PageB />),
      },
      {
        path: 'c',
        element: suspense(<LazyPageC />),
      },
    ],
  },
]

export const createRoot = ViteReactSSG({ routes })
