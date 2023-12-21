import { defineConfig, presetIcons, presetTypography, presetUno } from 'unocss'

export default defineConfig({
  theme: {
    colors: {
      l: {
        bg: 'rgb(255, 255, 255)',
        fg: 'rgb(85, 85, 85)',
        fgDeep: 'rgb(34, 34, 34)',
        fgDeeper: 'rgb(0, 0, 0)',
        dim: 'rgb(75, 85, 99)',
        border: 'rgba(125, 125, 125, 0.3)',
        codeBG: 'rgb(248, 248, 248)',
        innerCodeBG: 'rgba(130, 146, 167, 0.1)',
      },
      d: {
        bg: '#1b1b1f',
        fg: 'rgb(204, 208, 214)',
        fgDeep: 'rgb(221, 221, 221)',
        fgDeeper: 'rgb(255, 255, 255)',
        dim: 'rgb(161, 161, 170)',
        border: 'rgba(125, 125, 125, 0.4)',
        codeBG: 'rgba(52, 52, 52, 0.5)',
        innerCodeBG: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  presets: [
    presetTypography(),
    presetUno(),
    presetIcons({
      cdn: 'https://esm.sh/',
    }),
  ],
})
