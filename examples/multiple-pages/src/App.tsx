import React from 'react'
import type { RouteRecord } from 'vite-react-ssg'
import './App.css'

const Layout = React.lazy(() => import('./Layout'))

const pages = import.meta.glob<any>('./pages/**/*.tsx')

const children: RouteRecord[] = Object.entries(pages).map(([filepath, component]) => {
  let path = filepath.split('/pages')[1]
  path = path.split('.')[0].replace('index', '')
  const entry = `src${filepath.slice(1)}`

  if (filepath.includes('loader')) {
    return {
      path: '/loader/:comp',
      Component: React.lazy(component),
      loader: async (props) => {
        // console.log('🚀 ~ file: App.tsx:19 ~ loader: ~ props:', props)

        const comp = (await import('./components/load-comp-1')).default
        console.log('🚀 ~ file: App.tsx:22 ~ loader: ~ comp:', comp)
        return comp.toString()
      },
    } as RouteRecord
  }

  if (path.endsWith('/')) {
    return {
      index: true,
      Component: React.lazy(component),
      entry,
    }
  }
  return {
    path,
    Component: React.lazy(component),
    entry,
  }
})

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children,
    entry: 'src/Layout.tsx',
  },
]
