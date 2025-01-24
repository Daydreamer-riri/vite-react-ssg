import { ViteReactSSG } from 'vite-react-ssg'
import autoRoutes from '~react-pages'
import Layout from './Layout'
import './index.css'

const routesWithLayout = [{
  path: '/',
  Component: Layout,
  children: autoRoutes,
}]

export const createRoot = ViteReactSSG({ routes: routesWithLayout })
