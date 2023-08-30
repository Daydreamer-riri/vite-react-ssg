import type { RouteRecord } from 'vite-react-ssg'
import { ViteReactSSG } from 'vite-react-ssg'
import Layout from './Layout'
import Index from './pages'
import './index.css'
import * as Docs from './pages/[docs].tsx'

const routes: RouteRecord[] = [
  {
    index: true,
    Component: Index,
    entry: 'src/pages/index.tsx',
  },
  {
    path: '/docs/:docs',
    Component: Docs.Component,
    entry: Docs.entry,
    loader: Docs.loader,
    getStaticPaths: Docs.getStaticPaths,
  },
]

const routesWithLayout = [{
  path: '/',
  Component: Layout,
  children: routes,
}]

export const createRoot = ViteReactSSG({ routes: routesWithLayout })
