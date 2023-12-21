import { defineConfig } from 'vite'
import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react-swc'
import UnoCSS from 'unocss/vite'
import rehypeShikiji from 'rehype-shikiji'
import rehypeSlug from 'rehype-slug'
import rehypeAutoLinkHeadings from 'rehype-autolink-headings'

export default defineConfig({
  plugins: [
    mdx({
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutoLinkHeadings,
          {
            behavior: 'append',
            properties: { class: 'header-anchor' },
            content: {
              type: 'text',
              value: '#',
            },
          },
        ],
        [rehypeShikiji, { themes: { light: 'vitesse-light', dark: 'vitesse-dark' } }],
      ],
    }),
    UnoCSS(),
    react(),
  ],
  server: {
    // https: true,
  },
})
