import type { RouteRecord } from 'vite-react-ssg'
import Home from './pages'
import Layout from './pages/Layout'
import DocsLayout from './pages/docs/Layout'
import GettingStarted from './pages/docs/Getting-Started.md'
import NotFound from './pages/404.md'

export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: 'docs',
        Component: DocsLayout,
        children: [
          {
            path: 'Getting-Started',
            Component: GettingStarted,
          },
          {
            path: 'API',
            lazy: () => defaultToComponent(import('./pages/docs/API.md')),
          },
          {
            path: 'Components',
            lazy: () => defaultToComponent(import('./pages/docs/Components.md')),
          },
          {
            path: 'Integration',
            lazy: () => defaultToComponent(import('./pages/docs/Integration.md')),
          },
          {
            path: 'Configuration',
            lazy: () => defaultToComponent(import('./pages/docs/Configuration.md')),
          },
          {
            index: true,
            path: '*',
            Component: NotFound,
          },
        ],
      },
    ],
  },
]

async function defaultToComponent(modP: Promise<{ default: any }>) {
  const { default: Component } = await modP
  return { Component }
}
