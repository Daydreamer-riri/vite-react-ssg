import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/index', name: 'index' },
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
  ],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
})
