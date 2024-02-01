# API

## Extra route options

The RouteObject of vite-react-ssg is based on react-router, and vite-react-ssg receives some additional properties.

### `entry`

Used to obtain static resources.If you introduce static resources (such as css files) in that route and use lazy loading (such as React.lazy or route.lazy), you should set the entry field. It should be the path from root to the target file.

eg: `src/pages/page1.tsx`

### `getStaticPaths`

The `getStaticPaths()` function should return an array of path
to determine which paths will be pre-rendered by vite-react-ssg.

This function is only valid for dynamic route.

```ts
const route = {
  path: 'nest/:b',
  Component: React.lazy(() => import('./pages/nest/[b]')),
  entry: 'src/pages/nest/[b].tsx',
  // To determine which paths will be pre-rendered
  getStaticPaths: () => ['nest/b1', 'nest/b2'],
},
```

## With React-router lazy

These options work well with the `lazy` field.

```tsx
// src/pages/[page].tsx
export function Component() {
  return (
    <div>{/* your component */}</div>
  )
}

export function getStaticPaths() {
  return ['page1', 'page2']
}

export const entry = 'src/pages/[page].tsx'
```

```ts
// src/routes.ts
const routes = [
  {
    path: '/:page',
    lazy: () => import('./pages/[page]')
  }
]
```

See [example](https://github.com/Daydreamer-riri/vite-react-ssg/blob/main/examples/lazy-pages/src/App.tsx).

## Data fetch

You can use react-router-dom's `loader` to fetch data at build time and use `useLoaderData` to get the data in the component.

```tsx
import type { Params } from 'react-router-dom'
import { useLoaderData } from 'react-router-dom'

export function Component() {
  const data = useLoaderData()

  return (
    <div>{/* your component */}</div>
  )
}

export async function loader({ params }: { params: Params<string> }) {
  const data = await fetch(`/api/${params.path}/data`)
  return data
}

export function getStaticPaths() {
  // ... get path
  return path
}
```

See [example](https://github.com/Daydreamer-riri/vite-react-ssg/blob/main/examples/with-loader/src/pages/[docs].tsx).
