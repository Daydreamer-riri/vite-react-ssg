import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes'
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'
import './styles/global.css'

export const createRoot = ViteReactSSG({ routes })
