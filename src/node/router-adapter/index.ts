import type { ViteReactSSGContext as ContextForTanstack } from '~/client/tanstack'
import type { ViteReactSSGContext } from '~/types'
import { RemixAdapter } from './remix'
import { SinglePageAdapter } from './single-page'
import { TanstackAdapter } from './tanstack'

export function getAdapter(context: ViteReactSSGContext | ContextForTanstack) {
  switch (context.routerType) {
    case 'remix':
      return new RemixAdapter(context)
    case 'tanstack':
      return new TanstackAdapter(context)
    case 'single-page':
      return new SinglePageAdapter(context)
  }
}
