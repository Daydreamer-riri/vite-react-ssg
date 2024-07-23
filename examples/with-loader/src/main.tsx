import type { RouteRecord } from 'vite-react-ssg'
import { ViteReactSSG } from 'vite-react-ssg'
import Layout from './Layout'
import './index.css'

const routes: RouteRecord[] = [
  {
    index: true,
    lazy: () => import('./pages'),
    entry: 'src/pages/index.tsx',
  },
  {
    id: 'docs',
    path: '/docs/:docs',
    lazy: () => import('./pages/[docs]'),
  },
  {
    path: '/json',
    lazy: () => import('./pages/json'),
  },
]

const routesWithLayout = [{
  path: '/',
  Component: Layout,
  children: routes,
}]

export const createRoot = ViteReactSSG({ routes: routesWithLayout, basename: import.meta.env.BASE_URL })
