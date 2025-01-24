import type { PluginOption } from 'vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import {} from 'vite-react-ssg'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite({ autoCodeSplitting: true }), react()] as PluginOption[],
  base: '/tanstack',
  build: {
    sourcemap: true,
  },
})
