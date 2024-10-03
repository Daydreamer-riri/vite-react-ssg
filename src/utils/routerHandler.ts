import type { ViteReactSSGContext } from '../types'
import type { ViteReactSSGContext as ViteReactSSGTanstackContext } from '../client/tanstack'

export function distingushContext(context: ViteReactSSGContext | ViteReactSSGTanstackContext) {
  const { routerType } = context
  switch (routerType) {
    case 'tanstack':
      return { routerType, context: context as ViteReactSSGTanstackContext }
    case 'remix':
    case 'single-page':
      return { routerType, context: context as ViteReactSSGContext }
  }
}
