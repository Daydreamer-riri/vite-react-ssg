import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App'
import './index.css'

export const createRoot = ViteReactSSG(
  {
    routes,
    basename: import.meta.env.BASE_URL,
  },
)
