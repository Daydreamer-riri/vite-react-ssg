import type { RouteRecord } from 'vite-react-ssg'
import React from 'react'
import './App.css'

const Layout = React.lazy(() => import('./Layout'))

const pages = import.meta.glob<any>('./pages/**/*.tsx')

const children: RouteRecord[] = Object.entries(pages).map(([filepath, component]) => {
  let path = filepath.split('/pages')[1]
  path = path.split('.')[0].replace('index', '')

  if (path.endsWith('/')) {
    return {
      index: true,
      Component: React.lazy(component),
    }
  }
  return {
    path,
    Component: React.lazy(component),
  }
})

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children,
  },
]
