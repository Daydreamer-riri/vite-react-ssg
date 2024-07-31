import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App.js'
import './index.scss'

export const createRoot = ViteReactSSG({ routes })
