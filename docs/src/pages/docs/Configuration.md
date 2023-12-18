# Configuration

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
'minify' | 'prettify' | 'none'
```
**default** `'none'`

Apply formatter to the generated index file.

**It will cause Hydration Failed.**

### mode
#### type
```ts
string
```

Vite environmeng mode.

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
If enabled, you will need to configGure your serve
manually to handle dynamic routes properly.

### crittersOptions
#### type
```ts
CrittersOptions | false
```
**default** `{}`

Options for the critters packages.

@see https://github.com/GoogleChromeLabs/critters

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
() => Promise<void>
```

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
