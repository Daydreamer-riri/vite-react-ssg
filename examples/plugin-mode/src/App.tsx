import type { RouteRecord } from 'vite-react-ssg'
import React from 'react'
import './App.css'

const Layout = React.lazy(() => import('./Layout'))

export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: React.lazy(() => import('./pages/index')) },
      { path: 'about', Component: React.lazy(() => import('./pages/about')) },
    ],
  },
]
