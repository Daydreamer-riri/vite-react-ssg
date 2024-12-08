import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App'
import './index.css'

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
