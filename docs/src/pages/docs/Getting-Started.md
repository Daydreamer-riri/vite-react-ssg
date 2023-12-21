# Getting Started

## Installation

```bash
npm i -D vite-react-ssg react-router-dom
```

## Usage

```diff
// package.json
{
  "scripts": {
-   "build": "vite build"
+   "build": "vite-react-ssg build"
    // If you need ssr when dev
-   "dev": "vite",
+   "dev": "vite-react-ssg dev",

    // OR if you want to use another vite config file
+   "build": "vite-react-ssg build -c another-vite.config.ts"
  }
}
```

```ts
// src/main.ts
import { ViteReactSSG } from 'vite-react-ssg'
import routes from './App.tsx'

export const createRoot = ViteReactSSG(
  // react-router-dom data routes
  { routes },
  // function to have custom setups
  ({ router, routes, isClient, initialState }) => {
    // do something.
  },
)
```

```tsx
// src/App.tsx
import React from 'react'
import type { RouteRecord } from 'vite-react-ssg'
import './App.css'

const Layout = React.lazy(() => import('./Layout'))

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    entry: 'src/Layout.tsx',
    children: [
      {
        path: 'a',
        Component: React.lazy(() => import('./pages/a')),
        entry: 'src/pages/a.tsx',
      },
      {
        index: true,
        Component: React.lazy(() => import('./pages/index')),
        // Used to obtain static resources through manifest
        entry: 'src/pages/index.tsx',
      },
      {
        path: 'nest/:b',
        Component: React.lazy(() => import('./pages/nest/[b]')),
        entry: 'src/pages/nest/[b].tsx',
        // To determine which paths will be pre-rendered
        getStaticPaths: () => ['nest/b1', 'nest/b2'],
      },
    ],
  },
]
```

That's all!
