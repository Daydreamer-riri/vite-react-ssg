# Vite React SSG

Static-site generation for React on Vite.

[![NPM version](https://img.shields.io/npm/v/vite-react-ssg?color=a1b858&label=)](https://www.npmjs.com/package/vite-react-ssg)

## Install

> **This library requires Node.js version >= 17**
> or `Request` is available
<pre>
<b>npm i -D vite-react-ssg</b> <em>react-router-dom</em>
</pre>

```diff
// package.json
{
  "scripts": {
-   "dev": "vite",
-   "build": "vite build"
+   "dev": "vite-react-ssg dev",
+   "build": "vite-react-ssg build"

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

const pages = import.meta.glob<any>('./pages/**/*.tsx')

const children: RouteRecord[] = Object.entries(pages).map(([filepath, component]) => {
  let path = filepath.split('/pages')[1]
  path = path.split('.')[0].replace('index', '')
  const entry = `src${filepath.slice(1)}`

  if (path.endsWith('/')) {
    return {
      index: true,
      Component: React.lazy(component),
      entry,
    }
  }
  return {
    path,
    Component: React.lazy(component),
    // Used to obtain static resources through manifest
    entry,
  }
})

const Layout = React.lazy(() => import('./Layout'))
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children,
    // Used to obtain static resources through manifest
    entry: 'src/Layout.tsx',
  },
]
```

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

> It's important that the children of <ClientOnly> is not a JSX element, but a function that returns an element.
> Because React will try to render children, and may use the client's API on the server.

## Document head

You can use `<Head/>` to manage all of your changes to the document head. It takes plain HTML tags and outputs plain HTML tags. It is a wrapper around [React Helmet](https://github.com/nfl/react-helmet).

```tsx
import { Head } from 'vite-react-ssg'

const MyHead = () => (
  <Head>
    <meta property="og:description" content="My custom description" />
    <meta charSet="utf-8" />
    <title>My Title</title>
    <link rel="canonical" href="http://mysite.com/example" />
  </Head>
)
```

Nested or latter components will override duplicate usages:

```tsx
import { Head } from 'vite-react-ssg'

const MyHead = () => (
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

## Critical CSS

Vite SSG has built-in support for generating [Critical CSS](https://web.dev/extract-critical-css/) inlined in the HTML via the [`critters`](https://github.com/GoogleChromeLabs/critters) package.
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
      return routes.flatMap((route) => {
        return route.name === 'Blog'
          ? myBlogSlugs.map(slug => `/blog/${slug}`)
          : route.path
      })
    },
  },
}
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
- [ ] Initial State
- [ ] More Client components, such as `<ClientOnly />`

## License

[MIT](./LICENSE) License © 2023 [Riri](https://github.com/Daydreamer-riri)