# Vite React SSG

Static-site generation for React on Vite.

See demo(also document): [docs](https://vite-react-ssg.netlify.app/)

**🎈 Support for [`@tanstack/router`](https://tanstack.com/router/latest/docs/framework/react/overview)
and [`wouter`](https://github.com/molefrog/wouter) is in progress!**

Support for the [`@tanstack/router`](https://tanstack.com/router/latest/docs/framework/react/overview) router is still experimental, and `pathname.lazy.tsx routes` are not yet supported.
For usage examples, see: [`main`/examples/tanstack/src/main.tsx](https://github.com/Daydreamer-riri/vite-react-ssg/blob/main/examples/tanstack/src/main.tsx)

[![Mentioned in Vite Awesome](https://awesome.re/mentioned-badge.svg)](https://github.com/vitejs/awesome-vite)
[![NPM version](https://img.shields.io/npm/v/vite-react-ssg?color=a1b858&label=)](https://www.npmjs.com/package/vite-react-ssg)

## Table of contents

- [Usage](#usage)
- [Use CSR during development](#use-csr-during-development)
- [Extra route options](#extra-route-options)
  - [`entry`](#entry)
  - [`getStaticPaths`](#getstaticpaths)
- [Data fetch](#data-fetch)
- [lazy](#lazy)
- [`<ClientOnly/>`](#clientonly)
- [Document head](#document-head)
  - [Reactive head](#reactive-head)
- [Redirect](#redirect)
- [Public Base Path](#public-base-path)
- [Future config](#future-config)
- [CSS in JS](#css-in-js)
- [Critical CSS](#critical-css)
- [Configuration](#configuration)
  - [Custom Routes to Render](#custom-routes-to-render)
- [Roadmap](#roadmap)
- [Credits](#credits)

## Usage

<pre>
<b>npm i -D vite-react-ssg</b> <em>react-router-dom</em>
</pre>

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
import type { RouteRecord } from 'vite-react-ssg'
import React from 'react'
import Layout from './Layout'
import './App.css'

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    entry: 'src/Layout.tsx',
    children: [
      {
        path: 'a',
        lazy: () => import('./pages/a'),
      },
      {
        index: true,
        Component: React.lazy(() => import('./pages/index')),
      },
      {
        path: 'nest/:b',
        lazy: () => {
          const Component = await import('./pages/nest/[b]')
          return { Component }
        },
        // To determine which paths will be pre-rendered
        getStaticPaths: () => ['nest/b1', 'nest/b2'],
      },
    ],
  },
]
```

### Use CSR during development

Vite React SSG provide SSR (Server-Side Rendering) during development to ensure consistency
between development and production as much as possible.

But if you want to use CSR during development, just:

```diff
// package.json
{
  "scripts": {
-   "dev": "vite-react-ssg dev",
+   "dev": "vite",
    "build": "vite-react-ssg build"
  }
}
```

### Single Page SSG

For SSG of an index page only (i.e. without `react-router-dom`);
import `vite-react-ssg/single-page` instead.

```tsx
// src/main.tsx
import { ViteReactSSG } from 'vite-react-ssg/single-page'
import App from './App.tsx'

export const createRoot = ViteReactSSG(<App />)
```

## Extra route options

The RouteObject of vite-react-ssg is based on react-router, and vite-react-ssg receives some additional properties.

#### `getStaticPaths`

The `getStaticPaths()` function should return an array of path
to determine which paths will be pre-rendered by vite-react-ssg.

This function is only valid for dynamic route.

```tsx
const route = {
  path: 'nest/:b',
  lazy: () => import('./pages/nest/[b]'),
  entry: 'src/pages/nest/[b].tsx',
  // To determine which paths will be pre-rendered
  getStaticPaths: () => ['nest/b1', 'nest/b2'],
}
```

#### `entry`

**You are not required to use this field. It is only necessary when "prehydration style loss" occurs.**
It should be the path from root to the target file.

eg: `src/pages/page1.tsx`

## lazy

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
```

```ts
// src/routes.ts
const routes = [
  {
    path: '/:page',
    lazy: () => import('./pages/[page]'),
  }
]
```

**Note that** during the build process, `vite-react-ssg` will [automatically detect](https://github.com/Daydreamer-riri/vite-react-ssg/blob/main/src/node/assets.ts#L5) the files directly dynamically imported in the function you pass to the `lazy` field. This helps `vite-react-ssg` to get the route's style files or other static resources during the build, preventing [flash of unstyled content](https://en.wikipedia.org/wiki/Flash_of_unstyled_content).

If you still encounter FOUC (flash of unstyled content), please open an issue.

If your component isn't loading, make sure you have wrapped it or its parent in `Suspense` tags as described in the [React documentation](https://react.dev/reference/react/lazy#usage).

See [example](./examples/lazy-pages/src/App.tsx).

## Data fetch

You can use react-router-dom's `loader` to fetch data at build time and use `useLoaderData` to get the data in the component.

In production, the `loader` will only be executed at build time, and the data will be fetched by the manifest generated at build time during the browser navigations .

In the development environment, the `loader` also runs only on the server.It provides data to the HTML during initial server rendering, and during browser route navigations , it makes calls to the server by initiating a fetch on the service.

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

See [example | with-loader](./examples/with-loader/src/pages/[docs].tsx).

## `<ClientOnly/>`

If you need to render some component in browser only, you can wrap your component with `<ClientOnly>`.

```tsx
import { ClientOnly } from 'vite-react-ssg'

function MyComponent() {
  return (
    <ClientOnly>
      {() => {
        return <div>{window.location.href}</div>
      }}
    </ClientOnly>
  )
}
```

> It's important that the children of `<ClientOnly>` is not a JSX element, but a function that returns an element.
> Because React will try to render children, and may use the client's API on the server.

## Document head

You can use `<Head/>` to manage all of your changes to the document head. It takes plain HTML tags and outputs plain HTML tags. It is a wrapper around [React Helmet](https://github.com/nfl/react-helmet).

```tsx
import { Head } from 'vite-react-ssg'

function MyHead() {
  return (
    <Head>
      <meta property="og:description" content="My custom description" />
      <meta charSet="utf-8" />
      <title>My Title</title>
      <link rel="canonical" href="http://mysite.com/example" />
    </Head>
  )
}
```

Nested or latter components will override duplicate usages:

```tsx
import { Head } from 'vite-react-ssg'

function MyHead() {
  return (
    <parent>
      <Head>
        <title>My Title</title>
        <meta name="description" content="Helmet application" />
      </Head>
      <child>
        <Head>
          <title>Nested Title</title>
          <meta name="description" content="Nested component" />
        </Head>
      </child>
    </parent>
  )
}
```

Outputs:

```html
<head>
  <title>Nested Title</title>
  <meta name="description" content="Nested component" />
</head>
```

### Reactive head

```tsx
import { useState } from 'react'
import { Head } from 'vite-react-ssg'

export default function MyHead() {
  const [state, setState] = useState(false)

  return (
    <Head>
      <meta charSet="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <title>head test {state ? 'A' : 'B'}</title>
      {/* You can also set the 'body' attributes here */}
      <body className={`body-class-in-head-${state ? 'a' : 'b'}`} />
    </Head>
  )
}
```

## Redirect

You should not use redirect in the loader.
In vite-react-ssg, the loader only executes during the build process for data fetching.
If you need to perform a redirect in certain situations, you can use the following method to redirect on the client side:

```tsx
export const routes: RouteRecord[] = [
  {
    path: '/:lng',
    Component: Layout,
    getStaticPaths: () => Object.keys(resources),
    children: [
      // ... some routes
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
```

## Public Base Path

Just set `base` in vite.config.ts like:

```ts
import react from '@vitejs/plugin-react-swc'
// vite.config.ts
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/base-path',
})
```

```ts
// main.ts
import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App'
import './index.css'

export const createRoot = ViteReactSSG(
  {
    routes,
    // pass your BASE_URL
    basename: import.meta.env.BASE_URL,
  },
)
```

Vite React SSG will give it to the react-router's `basename`.

See: [react-router's create-browser-router](https://reactrouter.com/en/main/routers/create-browser-router#basename)

[Example](./examples/lazy-pages/vite.config.ts)

## Future config

```tsx
export const createRoot = ViteReactSSG(
  {
    routes,
    basename: import.meta.env.BASE_URL,
    future: {
      v7_normalizeFormMethod: true,
      v7_startTransition: true,
      v7_fetcherPersist: true,
      v7_relativeSplatPath: true,
      v7_skipActionErrorRevalidation: true,
      v7_partialHydration: true,
    },
  },
)
```

See: [react-router's optsfuture](https://reactrouter.com/6.28.0/routers/create-browser-router#optsfuture)

[Example](./examples/lazy-pages/src/main.tsx)

## CSS in JS

Use the `getStyleCollector` option to specify an SSR/SSG style collector. Currently only supports `styled-components`.

```tsx
import { ViteReactSSG } from 'vite-react-ssg'
import getStyledComponentsCollector from 'vite-react-ssg/style-collectors/styled-components'
import { routes } from './App.js'
import './index.css'

export const createRoot = ViteReactSSG(
  { routes },
  () => { },
  { getStyleCollector: getStyledComponentsCollector }
)
```

You can provide your own by looking at the [implementation](./src/style-collectors/) of any of the existing collectors.

## Critical CSS

Vite React SSG has built-in support for generating [Critical CSS](https://web.dev/extract-critical-css/) inlined in the HTML via the [`beasties`](https://github.com/danielroe/beasties) package.
Install it with:

```bash
npm i -D beasties
```

Critical CSS generation will automatically be enabled for you.

To configure `beasties`, pass [its options](https://github.com/danielroe/beasties#usage)
into `ssgOptions.beastiesOptions` in `vite.config.ts`:

```ts
// vite.config.ts
export default defineConfig({
  ssgOptions: {
    beastiesOptions: {
      // E.g., change the preload strategy
      preload: 'media',
      // Other options: https://github.com/danielroe/beasties#usage
    },
  },
})
```

## Configuration

You can pass options to Vite SSG in the `ssgOptions` field of your `vite.config.js`

```js
// vite.config.js

export default {
  plugins: [],
  ssgOptions: {
    script: 'async',
  },
}
```

```ts
interface ViteReactSSGOptions {
  /**
   * Set the scripts' loading mode. Only works for `type="module"`.
   *
   * @default 'sync'
   */
  script?: 'sync' | 'async' | 'defer' | 'async defer'
  /**
   * Build format.
   *
   * @default 'esm'
   */
  format?: 'esm' | 'cjs'
  /**
   * The path of the main entry file (relative to the project root).
   *
   * @default 'src/main.ts'
   */
  entry?: string
  /**
   * The path of the index.html file (relative to the project root).
   * @default 'index.html'
   */
  htmlEntry?: string
  /**
   * Mock browser global variables (window, document, etc...) from SSG.
   *
   * @default false
   */
  mock?: boolean
  /**
   * Apply formatter to the generated index file.
   *
   * **It will cause Hydration Failed.**
   *
   * @default 'none'
   */
  formatting?: 'prettify' | 'none'
  /**
   * Vite environment mode.
   */
  mode?: string
  /**
   * Directory style of the output directory.
   *
   * flat: `/foo` -> `/foo.html`
   * nested: `/foo` -> `/foo/index.html`
   *
   * @default 'flat'
   */
  dirStyle?: 'flat' | 'nested'
  /**
   * Generate for all routes, including dynamic routes.
   * If enabled, you will need to configure your serve
   * manually to handle dynamic routes properly.
   *
   * @default false
   */
  includeAllRoutes?: boolean
  /**
   * Options for the beasties packages.
   *
   * @see https://github.com/danielroe/beasties#usage
   */
  beastiesOptions?: BeastiesOptions | false
  /**
   * Custom function to modify the routes to do the SSG.
   *
   * Works only when `includeAllRoutes` is set to false.
   *
   * Defaults to a handler that filters out all the dynamic routes.
   * When passing your custom handler, you should also take care of the dynamic routes yourself.
   */
  includedRoutes?: (paths: string[], routes: Readonly<RouteRecord[]>) => Promise<string[]> | string[]
  /**
   * Callback to be called before every page render.
   *
   * It can be used to transform the project's `index.html` file before passing it to the renderer.
   *
   * To do so, you can change the 'index.html' file contents (passed in through the `indexHTML` parameter), and return it.
   * The returned value will then be passed to renderer.
   */
  onBeforePageRender?: (route: string, indexHTML: string, appCtx: ViteReactSSGContext<true>) => Promise<string | null | undefined> | string | null | undefined
  /**
   * Callback to be called on every rendered page.
   *
   * It can be used to transform the current route's rendered HTML.
   *
   * To do so, you can transform the route's rendered HTML (passed in through the `renderedHTML` parameter), and return it.
   * The returned value will be used as the HTML of the route.
   */
  onPageRendered?: (route: string, renderedHTML: string, appCtx: ViteReactSSGContext<true>) => Promise<string | null | undefined> | string | null | undefined

  onFinished?: () => Promise<void> | void
  /**
   * The application's root container `id`.
   *
   * @default `root`
   */
  rootContainerId?: string
  /**
   * The size of the SSG processing queue.
   *
   * @default 20
   */
  concurrency?: number
}
```

See [src/types.ts](./src/types.ts). for more options available.

### Custom Routes to Render

You can use the `includedRoutes` hook to include or exclude route paths to render, or even provide some completely custom ones.

```js
// vite.config.js

export default {
  plugins: [],
  ssgOptions: {
    includedRoutes(paths, routes) {
      // exclude all the route paths that contains 'foo'
      return paths.filter(i => !i.includes('foo'))
    },
  },
}
```

```js
// vite.config.js

export default {
  plugins: [],
  ssgOptions: {
    includedRoutes(paths, routes) {
      // use original route records
      return routes.flatMap(route => {
        return route.name === 'Blog'
          ? myBlogSlugs.map(slug => `/blog/${slug}`)
          : route.path
      })
    },
  },
}
```

```ts
export default defineConfig({
  server: {
    https: true,
  },
})
```

### React17 Support

- for react18, with flag `useLegacyRender: true`, it will use the legacy `render` and `hydrate` methods.
- for react17, on top of above, you will need minor update to react and react-dom [example](https://github.com/jesse23/webpack-test-bed/blob/main/scripts/define-react-exports.js) to polyfill the mjs import and the `react-dom/client`.

## Roadmap

- [x] Support `react19`
- [ ] no index.html mode

## Credits

This project inspired by [vite-ssg](https://github.com/antfu/vite-ssg), thanks to [@antfu](https://github.com/antfu) for his awesome work.

## License

[MIT](./LICENSE) License © 2023 [Riri](https://github.com/Daydreamer-riri)
