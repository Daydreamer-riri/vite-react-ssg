# Vite React SSG

Static-site generation for React on Vite.

See demo(also document): [docs](https://vite-react-ssg.netlify.app/)

[![NPM version](https://img.shields.io/npm/v/vite-react-ssg?color=a1b858&label=)](https://www.npmjs.com/package/vite-react-ssg)

# Table of contents
* [Usage](#usage)
* [Extra route options](#extra-route-options)
  * [`entry`](#entry)
  * [`getStaticPaths`](#getstaticpaths)
* [lazy](#lazy)
* [`<ClientOnly/>`](#clientonly)
* [Document head](#document-head)
  * [Reactive head](#reactive-head)
* [Public Base Path](#public-base-path)
* [CSS in JS](#css-in-js)
* [Critical CSS](#critical-css)
* [Configuration](#configuration)
  * [Custom Routes to Render](#custom-routes-to-render)
  * [Https](#https)
* [Use CSR in development environment](#use-csr-in-development-environment)
* [Roadmap](#roadmap)
* [Credits](#credits)

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

## Extra route options

The RouteObject of vite-react-ssg is based on react-router, and vite-react-ssg receives some additional properties.

#### `entry`
Used to obtain static resources.If you introduce static resources (such as css files) in that route and use lazy loading (such as React.lazy or route.lazy), you should set the entry field. It should be the path from root to the target file.

eg: `src/pages/page1.tsx`

#### `getStaticPaths`
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

See [example](./examples/lazy-pages/src/App.tsx).

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

## Public Base Path

Just set `base` in vite.config.ts like:
```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/base-path',
})
```

Vite React SSG will give it to the react-router's `basename`.
See: [react-router's create-browser-router](https://reactrouter.com/en/main/routers/create-browser-router#basename)
[Example](./examples/lazy-pages/vite.config.ts)

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

Vite React SSG has built-in support for generating [Critical CSS](https://web.dev/extract-critical-css/) inlined in the HTML via the [`critters`](https://github.com/GoogleChromeLabs/critters) package.
Install it with:

```bash
npm i -D critters
```

Critical CSS generation will automatically be enabled for you.

To configure `critters`, pass [its options](https://github.com/GoogleChromeLabs/critters#usage) into `ssgOptions.crittersOptions` in `vite.config.ts`:

```ts
// vite.config.ts
export default defineConfig({
  ssgOptions: {
    crittersOptions: {
      // E.g., change the preload strategy
      preload: 'media',
      // Other options: https://github.com/GoogleChromeLabs/critters#usage
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
  formatting?: 'minify' | 'prettify' | 'none'
  /**
   * Vite environmeng mode.
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
   * If enabled, you will need to configGure your serve
   * manually to handle dynamic routes properly.
   *
   * @default false
   */
  includeAllRoutes?: boolean
  /**
   * Options for the critters packages.
   *
   * @see https://github.com/GoogleChromeLabs/critters
   */
  crittersOptions?: CrittersOptions | false
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

### Https

If you set `https` to true in Vite, we will by default use `devcert` to generate a local HTTPS service for you. Of course, if you pass in your own custom https parameters, we will also help you pass them through to the Express server.

```ts
export default defineConfig({
  server: {
    https: true,
  },
})
```

## Use CSR in development environment

If you want to use CSR during development, just:
```ts
// src/main.ts
import { ViteReactSSG } from 'vite-react-ssg'
import routes from './App.tsx'

export const createRoot = ViteReactSSG(
  { routes },
  ({ router, routes, isClient, initialState }) => {
    // do something.
  },
  {
    // Default value is `true`
    ssrWhenDev: false
  }
)
```

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
Then, you can start the application with CSR in the development environment.

## Roadmap

- [x] Preload assets
- [x] Document head
- [x] SSR in dev environment
- [x] More Client components, such as `<ClientOnly />`
- [x] `getStaticPaths` for dynamic routes
- [ ] Initial State

## Credits
This project inspired by [vite-ssg](https://github.com/antfu/vite-ssg), thanks to [@antfu](https://github.com/antfu) for his awesome work.

## License

[MIT](./LICENSE) License © 2023 [Riri](https://github.com/Daydreamer-riri)
