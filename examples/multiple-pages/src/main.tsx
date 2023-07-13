import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App.js'
import './index.css'

export const createApp = ViteReactSSG({ routes })

// export const createApp = ViteReactSSG(
//   <App />,
//   routes,
// )
