import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()] as PluginOption[],
  base: '/base-path',
})
