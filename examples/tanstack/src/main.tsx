import { createRouter } from '@tanstack/react-router'
import { Experimental_ViteReactSSG as ViteReactSSG } from 'vite-react-ssg/tanstack'
import { routeTree } from './routeTree.gen'

// Set up a Router instance

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  basepath: import.meta.env.BASE_URL,
})

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export const createRoot = ViteReactSSG({
  router,
  routes: routeTree,
  basename: import.meta.env.BASE_URL,
}, () => {})
