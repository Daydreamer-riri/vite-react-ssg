import type { RouteRecord } from 'vite-react-ssg'
import './App.css'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { resources } from './i18n'

export const routes: RouteRecord[] = [
  {
    path: '/:lng',
    Component: Layout,
    getStaticPaths: () => Object.keys(resources),
    children: [
      {
        path: 'a',
        lazy: () => import('./pages/a'),
      },
      {
        index: true,
        lazy: () => defaultToComponent(import('./pages/index')),
      },
      {
        path: 'nest/:b',
        lazy: () => defaultToComponent(import('./pages/nest/[b]')),
      },
    ],
  },
  {
    path: '/',
    Component: () => {
      const navigate = useNavigate()
      useEffect(() => {
        navigate('/en', { replace: true })
      }, [navigate])

      return null
    },
  },
]

async function defaultToComponent(routePromise: Promise<RouteRecord & { default: any }>) {
  const routeModule = await routePromise

  return { ...routeModule, Component: routeModule.default }
}
