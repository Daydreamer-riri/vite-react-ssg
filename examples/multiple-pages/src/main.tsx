import type { RouteRecord } from 'vite-react-ssg'
import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App.js'
import './index.css'

export const createRoot = ViteReactSSG({ routes })

export function includedRoutes(paths: string[], routes: RouteRecord[]) {
  console.log(paths)
  return ['/', '/loader/1', '/a']
}
