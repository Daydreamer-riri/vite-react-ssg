import type { PluginOption, UserConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { } from 'vite-react-ssg'

export default defineConfig({
  plugins: [react()] as PluginOption[],
  ssgOptions: {
    crittersOptions: false,
  },
} as UserConfig)
