# Configuration

## Public Base Path

Just set `base` in vite.config.ts like:

```ts
// vite.config.ts
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/base-path',
})
```

And pass it to `routerOptions`:

```ts {9-10}
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

See:

> - [react-router's create-browser-router](https://reactrouter.com/en/main/routers/create-browser-router#basename)
> - [vite config base](https://cn.vitejs.dev/config/shared-options.html#base)

[Example](https://github.com/Daydreamer-riri/vite-react-ssg/blob/main/examples/lazy-pages/vite.config.ts)

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

[Example](https://github.com/Daydreamer-riri/vite-react-ssg/blob/main/examples/lazy-pages/src/main.tsx)

## `ssgOptions`

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

### script

#### type

```ts
'sync' | 'async' | 'defer' | 'async defer'
```

**default** `'sync'`

Set the scripts' loading mode. Only works for `type="module"`.

### format

#### type

```ts
'esm' | 'cjs'
```

**default** `'esm'`

Build format.

### entry

#### type

```ts
string
```

**default** `'src/main.ts'`

The path of the main entry file (relative to the project root).

### htmlEntry

#### type

```ts
string
```

**default** `'index.html'`

The path of the index.html file (relative to the project root).

### mock

#### type

```ts
boolean
```

**default** `false`

Mock browser global variables (window, document, etc...) from SSG.

### formatting

#### type

```ts
'prettify' | 'none'
```

**default** `'none'`

Apply formatter to the generated index file.

**It will cause Hydration Failed.**

### mode

#### type

```ts
string
```

Vite environment mode.

### dirStyle

#### type

```ts
'flat' | 'nested'
```

**default** `'flat'`

Directory style of the output directory.

flat: `/foo` -> `/foo.html`
nested: `/foo` -> `/foo/index.html`

### includeAllRoutes

#### type

```ts
boolean
```

**default** `false`

Generate for all routes, including dynamic routes.
If enabled, you will need to configure your serve
manually to handle dynamic routes properly.

### crittersOptions

#### type

```ts
CrittersOptions | false
```

**default** `{}`

Options for the critters packages.

@see <https://github.com/GoogleChromeLabs/critters>

### onBeforePageRender

#### type

```ts
(route: string, indexHTML: string, appCtx: ViteReactSSGContext<true>) => Promise<string | null | undefined> | string | null | undefined
```

Callback to be called before every page render.

It can be used to transform the project's `index.html` file before passing it to the renderer.

To do so, you can change the 'index.html' file contents (passed in through the `indexHTML` parameter), and return it.
The returned value will then be passed to renderer.

### onPageRendered

#### type

```ts
(route: string, renderedHTML: string, appCtx: ViteReactSSGContext<true>) => Promise<string | null | undefined> | string | null | undefined
```

Callback to be called on every rendered page.

It can be used to transform the current route's rendered HTML.

To do so, you can transform the route's rendered HTML (passed in through the `renderedHTML` parameter), and return it.
The returned value will be used as the HTML of the route.

### onFinished

#### type

```ts
(dir: string) => Promise<void>
```

A function that is run after generation is complete.
It receives the build output directory as a string.

You can use this to add, edit, or delete files in the output
directory that you don't want to manage in React.

### rootContainerId

#### type

```ts
string
```

**default** `'root'`

The application's root container `id`.

### concurrency

#### type

```ts
number
```

**default** `20`

The size of the SSG processing queue.

## Extend Vite

We have inherited some configuration options from Vite.

### Https

#### type

```ts
boolean | ServerOptions
```

**default** `undefined`

If you set `https` to true in Vite, we will by default use `devcert` to generate a local HTTPS service for you. Of course, if you pass in your own custom https parameters, we will also help you pass them through to the Express server.
