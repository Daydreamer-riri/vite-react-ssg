import type { PluginOption } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mdx from '@mdx-js/rollup'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/with-loader/',
  plugins: [
    mdx(),
    react(),
  ] as PluginOption[],
})
