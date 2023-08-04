import { ViteReactSSG } from 'vite-react-ssg'
import Layout from './Layout'
import autoRoutes from '~react-pages'
import './index.css'

const routesWithLayout = [{
  path: '/',
  Component: Layout,
  children: autoRoutes,
}]

export const createRoot = ViteReactSSG({ routes: routesWithLayout })
