import type { PluginOption } from 'vite'
import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/with-loader/',
  plugins: [
    mdx(),
    react(),
  ] as PluginOption[],
})
