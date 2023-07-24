import type { Options as CrittersOptions } from 'critters'
import type { IndexRouteObject, NonIndexRouteObject, createBrowserRouter } from 'react-router-dom'

type Router = ReturnType<typeof createBrowserRouter>

export interface ViteReactSSGOptions {
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
   * The application's root container `class`.
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

type PartialKeys<T, Keys extends keyof T> = Omit<T, Keys> & Partial<Pick<T, Keys>>

export interface ViteReactSSGContext<HasRouter extends boolean = true> {
  router?: HasRouter extends true ? Router : undefined
  routes: HasRouter extends true ? Readonly<RouteRecord[]> : undefined
  routerOptions: RouterOptions
  initialState: Record<string, any>
  // head: VueHeadClient<MergeHead> | undefined
  isClient: boolean
  onSSRAppRendered(cb: Function): void
  triggerOnSSRAppRendered(route: string, appHTML: string, appCtx: ViteReactSSGContext): Promise<unknown[]>
  transformState?(state: any): any
  /**
   * Current router path on SSG, `undefined` on client side.
   */
  routePath?: string
}

export interface ViteReactSSGClientOptions {
  transformState?: (state: any) => any
  registerComponents?: boolean
  /**
   * The application's root container query selector.
   *
   * @default `#root`
   */
  rootContainer?: string | Element
}

interface CommonRouteOptions {
  /**
   * Used to obtain static resources through manifest
   *
   * @example `src/pages/home.tsx
   */
  entry?: string
}

export type NonIndexRouteRecord = Omit<NonIndexRouteObject, 'children'> & {
  children?: RouteRecord[]
} & CommonRouteOptions

export type IndexRouteRecord = IndexRouteObject & CommonRouteOptions

export type RouteRecord = NonIndexRouteRecord | IndexRouteRecord

export interface RouterOptions {
  routes: RouteRecord[]
  createFetchRequest?: <T>(req: T) => Request
}

// extend vite.config.ts
declare module 'vite' {
  interface UserConfig {
    ssgOptions?: ViteReactSSGOptions
  }
}
