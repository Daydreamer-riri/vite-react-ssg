# API

## Extra route options

The RouteObject of vite-react-ssg is based on react-router, and vite-react-ssg receives some additional properties.

### `getStaticPaths`

The `getStaticPaths()` function should return an array of path
to determine which paths will be pre-rendered by vite-react-ssg.

This function is only valid for dynamic route.

```ts
const route = {
  path: 'nest/:b',
  lazy: () => import('./pages/nest/[b]'),
  entry: 'src/pages/nest/[b].tsx',
  // To determine which paths will be pre-rendered
  getStaticPaths: () => ['nest/b1', 'nest/b2'],
}
```

### `entry`

**You are not required to use this field. It is only necessary when "prehydration style loss" occurs.**
It should be the path from root to the target file.

eg: `src/pages/page1.tsx`

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

**Note that** during the build process, `vite-react-ssg` will [automatically detect](https://github.com/Daydreamer-riri/vite-react-ssg/blob/main/src/node/assets.ts#L5) the files directly dynamically imported in the function you pass to the `lazy` field. This helps `vite-react-ssg` to get the route's style files or other static resources during the build, preventing [flash of unstyled content](https://en.wikipedia.org/wiki/Flash_of_unstyled_content).

If you still encounter FOUC (flash of unstyled content), please open an issue.

If your component isn't loading, make sure you have wrapped it or its parent in `Suspense` tags as described in the [React documentation](https://react.dev/reference/react/lazy#usage).

See [example](https://github.com/Daydreamer-riri/vite-react-ssg/blob/main/examples/lazy-pages/src/App.tsx).

## Data fetch

You can use react-router-dom's `loader` to fetch data at build time and use `useLoaderData` to get the data in the component.

In production, the `loader` will only be executed at build time, and the data will be fetched by the manifest generated at build time during the browser navigations .

In the development environment, the `loader` also runs only on the server.It provides data to the HTML during initial server rendering, and during browser route navigations, it makes calls to the server by initiating a fetch on the service.

```tsx
import { useLoaderData } from 'react-router-dom'

export default function Docs() {
  const data = useLoaderData() as Awaited<ReturnType<typeof loader>>

  return (
    <>
      <div>{data.key}</div>
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <div dangerouslySetInnerHTML={{ __html: data.packageCodeHtml }} style={{ textAlign: 'start' }}></div>
    </>
  )
}

export const Component = Docs

export const entry = 'src/pages/json.tsx'

export async function loader() {
  // The code here will not be executed on the client side, and the modules imported will not be sent to the client.
  const fs = (await import('node:fs'))
  const cwd = process.cwd()
  const json = (await import('../docs/test.json')).default

  const packageJson = await fs.promises.readFile(`${cwd}/package.json`, 'utf-8')
  const { codeToHtml } = await import('shiki')
  const packageJsonHtml = await codeToHtml(packageJson, { lang: 'json', theme: 'vitesse-light' })

  return {
    ...json,
    packageCodeHtml: packageJsonHtml,
  }
}
```

See [example](https://github.com/Daydreamer-riri/vite-react-ssg/blob/main/examples/with-loader/src/pages/[docs].tsx).
