import type { PluginOption } from 'vite'
import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import react from '@vitejs/plugin-react-swc'
import rehypeAutoLinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

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
        // @ts-expect-error ignore
        [rehypeShiki, { themes: { light: 'vitesse-light', dark: 'vitesse-dark' } }],
      ],
    }) as PluginOption,
    UnoCSS() as PluginOption,
    react(),
  ],
  server: {
    // https: true,
  },
})
