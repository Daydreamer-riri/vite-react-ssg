import type { FilledContext } from 'react-helmet-async'
import type { IRouterAdapter, RenderResult } from './interface'
import type { ViteReactSSGContext } from '~/types'
import { HelmetProvider } from 'react-helmet-async'
import { renderStaticApp } from '../serverRenderer'
import { extractHelmet } from './utils'

export class SinglePageAdapter implements IRouterAdapter<ViteReactSSGContext> {
  context: ViteReactSSGContext<true>
  constructor(context: ViteReactSSGContext) {
    this.context = context
  }

  render: (path: string) => Promise<RenderResult> = async () => {
    const { app: inner, getStyleCollector } = this.context
    const helmetContext = {} as FilledContext
    const styleCollector = getStyleCollector ? await getStyleCollector() : null
    let app = (
      <HelmetProvider context={helmetContext}>
        {inner}
      </HelmetProvider>
    )

    if (styleCollector)
      app = styleCollector.collect(app)

    const appHTML = await renderStaticApp(app)

    const { htmlAttributes, bodyAttributes, metaAttributes, styleTag } = extractHelmet(appHTML, helmetContext, styleCollector)

    return { appHTML, htmlAttributes, bodyAttributes, metaAttributes, styleTag, routerContext: { loaderData: {} } }
  }

  handleLoader = () => {}
}
