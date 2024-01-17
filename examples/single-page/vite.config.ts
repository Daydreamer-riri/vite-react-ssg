import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { } from 'vite-react-ssg'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/single/',
  ssgOptions: {
    // It will cause Hydration Failed
    // formatting: 'minify',
  },
})
