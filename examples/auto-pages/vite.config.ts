import type { PluginOption } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import pages from 'vite-plugin-pages'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    pages({
      extendRoute(route) {
        route.entry = route?.element?.slice?.(1)
        return route
      },
      importMode: 'async',
      routeStyle: 'remix',
    }) as PluginOption,
  ],
})
