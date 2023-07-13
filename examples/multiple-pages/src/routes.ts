import React from 'react'

export const routes = [
  {
    path: '/',
    element: React.lazy(() => import('./pages/index')),
    children: [
      {
        path: '/a',
        element: React.lazy(() => import('./pages/a')),
      },
    ],
  },

]
