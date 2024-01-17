import { ViteReactSSG } from 'vite-react-ssg/single-page'
import Index from './App.js'
import './index.css'

export const createRoot = ViteReactSSG(
  <Index />,
)
