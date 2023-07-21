import React from 'react'
import { Layout } from './Layout'
import './App.css'

const pages = import.meta.glob<any>('./pages/**/*.tsx')
console.log('🚀 ~ file: App.tsx:7 ~ pages:', pages)

const children = Object.entries(pages).map(([filepath, component]) => {
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

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children,
  },
]

// export const router = createBrowserRouter(routes)
