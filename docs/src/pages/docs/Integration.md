# Integration

## CSS in JS

Use the `getStyleCollector` option to specify an SSR/SSG style collector. Currently only supports `styled-components`.

```tsx
import { ViteReactSSG } from 'vite-react-ssg'
import getStyledComponentsCollector from 'vite-react-ssg/style-collectors/styled-components'
import { routes } from './App.js'
import './index.css'

export const createRoot = ViteReactSSG(
  { routes },
  () => { },
  { getStyleCollector: getStyledComponentsCollector })
```

You can provide your own by looking at the [implementation](./src/style-collectors/) of any of the existing collectors.

## Critical CSS

Vite SSG has built-in support for generating [Critical CSS](https://web.dev/extract-critical-css/) inlined in the HTML via the [`critters`](https://github.com/GoogleChromeLabs/critters) package.
Install it with:

```bash
npm i -D critters
```

Critical CSS generation will automatically be enabled for you.

To configure `critters`, pass [its options](https://github.com/GoogleChromeLabs/critters#usage) into `ssgOptions.crittersOptions` in `vite.config.ts`:

```ts
// vite.config.ts
export default defineConfig({
  ssgOptions: {
    crittersOptions: {
      // E.g., change the preload strategy
      preload: 'media',
      // Other options: https://github.com/GoogleChromeLabs/critters#usage
    },
  },
})
```
