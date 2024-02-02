import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { } from 'vite-react-ssg'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  ssgOptions: {
    // It will cause Hydration Failed
    // formatting: 'minify',
  },
})
