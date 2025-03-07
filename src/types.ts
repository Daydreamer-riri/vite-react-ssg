import type { Options as BeastiesOptions } from 'beasties'
import type { ReactElement, ReactNode } from 'react'
import type { FutureConfig as CompFutureConfig, createBrowserRouter, IndexRouteObject, NonIndexRouteObject } from 'react-router-dom'

type Router = ReturnType<typeof createBrowserRouter>
export interface CrittersOptions {
  path?: string
  publicPath?: string
  external?: boolean
  inlineThreshold?: number
  minimumExternalSize?: number
  pruneSource?: boolean
  mergeStylesheets?: boolean
  additionalStylesheets?: string[]
  preload?: 'body' | 'media' | 'swap' | 'js' | 'js-lazy'
  noscriptFallback?: boolean
  inlineFonts?: boolean
  preloadFonts?: boolean
  fonts?: boolean
  keyframes?: string
  compress?: boolean
  logLevel?: 'info' | 'warn' | 'error' | 'trace' | 'debug' | 'silent'
  reduceInlineStyles?: boolean
  // logger?: Logger
}

export interface ViteReactSSGOptions<Context = ViteReactSSGContext> {
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
   * @deprecated Use `beastiesOptions` instead.
   * @see https://github.com/GoogleChromeLabs/critters
   */
  crittersOptions?: CrittersOptions | false
  /**
   * Options for the beasties package.
   *
   * @see https://github.com/danielroe/beasties
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
  onBeforePageRender?: (route: string, indexHTML: string, appCtx: Context) => Promise<string | null | undefined> | string | null | undefined
  /**
   * Callback to be called on every rendered page.
   *
   * It can be used to transform the current route's rendered HTML.
   *
   * To do so, you can transform the route's rendered HTML (passed in through the `renderedHTML` parameter), and return it.
   * The returned value will be used as the HTML of the route.
   */
  onPageRendered?: (route: string, renderedHTML: string, appCtx: Context) => Promise<string | null | undefined> | string | null | undefined

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

export interface ViteReactSSGContext<HasRouter extends boolean = true> {
  router?: HasRouter extends true ? Router : undefined
  routes: HasRouter extends true ? Readonly<RouteRecord[]> : undefined
  routerOptions: HasRouter extends true ? RouterOptions : undefined
  initialState: Record<string, any>
  isClient: boolean
  onSSRAppRendered: (cb: Function) => void
  triggerOnSSRAppRendered: (route: string, appHTML: string, appCtx: ViteReactSSGContext) => Promise<unknown[]>
  transformState?: (state: any) => any
  /**
   * Current router path on SSG, `undefined` on client side.
   */
  routePath?: string
  base: string
  getStyleCollector: (() => StyleCollector | Promise<StyleCollector>) | null
  app?: HasRouter extends true ? never : ReactNode

  routerType: 'remix' | 'single-page'
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
  /**
   * @deprecated This option is no longer needed
   */
  ssrWhenDev?: boolean
  getStyleCollector?: (() => StyleCollector | Promise<StyleCollector>) | null
  // true if the app is based on react17 compatible API
  useLegacyRender?: boolean
}

interface CommonRouteOptions {
  /**
   * Used to obtain static resources through manifest
   *
   * **You are not required to use this field. It is only necessary when "prehydration style loss" occurs.**
   *
   * @example `src/pages/home.tsx`
   */
  entry?: string
  /**
   * The getStaticPaths() function should return an array of path
   * to determine which paths will be pre-rendered by vite-react-ssg.
   *
   * This function is only valid for dynamic route.
   *
   * @example () => ['path1', 'path2']
   */
  getStaticPaths?: () => string[] | Promise<string[]>
}

export type NonIndexRouteRecord = Omit<NonIndexRouteObject, 'children'> & {
  children?: RouteRecord[]
} & CommonRouteOptions

export type IndexRouteRecord = IndexRouteObject & CommonRouteOptions

export type RouteRecord = NonIndexRouteRecord | IndexRouteRecord

export interface RouterFutureConfig {
  v7_fetcherPersist?: boolean
  v7_normalizeFormMethod?: boolean
  v7_partialHydration?: boolean
  v7_relativeSplatPath?: boolean
  v7_skipActionErrorRevalidation?: boolean
}

export interface RouterOptions {
  routes: RouteRecord[]
  basename?: string
  future?: Partial<RouterFutureConfig & CompFutureConfig>
}

export interface StyleCollector {
  collect: (app: ReactElement) => ReactElement
  toString: (html: string) => string
  cleanup?: () => void
}

// extend vite.config.ts
// eslint-disable-next-line ts/ban-ts-comment
// @ts-ignore
declare module 'vite' {
  interface UserConfig {
    ssgOptions?: ViteReactSSGOptions
  }
}
