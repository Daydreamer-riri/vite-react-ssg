import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App.js'
import './index.css'

export const createRoot = ViteReactSSG({ routes })
