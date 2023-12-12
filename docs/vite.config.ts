import { defineConfig } from 'vite'
import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react-swc'
import UnoCSS from 'unocss/vite'
import shiki from 'shiki'
import rehypeShiki from '@leafac/rehype-shiki'

export default defineConfig({
  plugins: [
    // @ts-expect-error rollup version
    mdx({ rehypePlugins: [[rehypeShiki, { highlighter: await shiki.getHighlighter({ theme: 'vitesse-light' }) }]] }),
    UnoCSS(),
    react(),
  ],
  server: {
    // https: true,
  },
})
