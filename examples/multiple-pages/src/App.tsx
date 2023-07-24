import React from 'react'
import './App.css'

// import { Layout } from './Layout'

const Layout = React.lazy(() => import('./Layout'))

const pages = import.meta.glob<any>('./pages/**/*.tsx')
console.log('🚀 ~ file: App.tsx:7 ~ pages:', pages)

const children = Object.entries(pages).map(([filepath, component]) => {
  let path = filepath.split('/pages')[1]
  path = path.split('.')[0].replace('index', '')
  const entry = `src${filepath.slice(1)}`

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

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children,
    entry: 'src/Layout.tsx',
  },
]

// export const router = createBrowserRouter(routes)
