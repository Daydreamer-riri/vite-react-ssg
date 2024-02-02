import ririd from '@ririd/eslint-config'

export default ririd({
  formatters: true,
  ignores: [
    '**/routeTree.gen.ts',
  ],
})
