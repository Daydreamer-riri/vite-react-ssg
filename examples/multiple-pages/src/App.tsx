import React from 'react'
import { Layout } from './Layout'
import './App.css'
import Index from './pages'

// import A from './pages/a'

// export const routes = [
//   {
//     path: '/',
//     element: React.lazy(() => import('./pages/index')),
//     children: [
//       {
//         path: '/a',
//         element: React.lazy(() => import('./pages/a')),
//       },
//     ],
//   },

// ]
// const sleep = (n = 500) => new Promise(r => setTimeout(r, n))

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: 'a',
        Component: React.lazy(async () => {
          // await sleep(3000)
          return import('./pages/a')
        }),
      },
    ],
  },
]

// export const router = createBrowserRouter(routes)
