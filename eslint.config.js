import ririd from '@ririd/eslint-config'

export default ririd({
  formatters: true,
  rules: {
    'ts/no-unsafe-function-type': 'off',
    'ts/no-unused-expressions': 'off',
    'eslint-comments/no-unlimited-disable': 'off',
    'pnpm/json-enforce-catalog': 'off',
    'pnpm/json-prefer-workspace-settings': 'off',
    'react/prefer-namespace-import': 'off',
  },
}, {
  files: ['**/*.md/**/*.html'],
  rules: {
    'format/prettier': 'off',
  },
})
