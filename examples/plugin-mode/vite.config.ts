import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { reactSSG } from 'vite-react-ssg/plugin'

export default defineConfig({
  plugins: [react(), reactSSG()],
  base: '/plugin-mode/',
})
