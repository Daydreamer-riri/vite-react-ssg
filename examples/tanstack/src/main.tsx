import { createRouter } from '@tanstack/react-router'
import { ViteReactSSG } from 'vite-react-ssg/tanstack'
import { routeTree } from './routeTree.gen'

// Set up a Router instance

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// const rootElement = document.getElementById('app')!

export const createRoot = ViteReactSSG({
  router,
  routes: routeTree,
}, () => {})

if (false) {
  // const root = ReactDOM.createRoot(rootElement)
  // root.render(<RouterProvider router={router} />)
}