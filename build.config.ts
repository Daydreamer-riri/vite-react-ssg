import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/index', name: 'index' },
    { input: 'src/client/single-page', name: 'client/single-page' },
    { input: 'src/client/tanstack', name: 'tanstack' },
    { input: 'src/node/cli', name: 'node/cli' },
    { input: 'src/node', name: 'node' },
    { input: 'src/style-collectors/styled-components', name: 'style-collectors/styled-components' },
  ],
  declaration: true,
  clean: true,
  externals: [
    'react',
    'react-dom',
    'react-dom/server',
    'react-router-dom',
    'react-router-dom/server',
    '@tanstack/react-router',
    '@tanstack/start/client',
    '@tanstack/start/server',
  ],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
})
