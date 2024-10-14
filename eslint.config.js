import ririd from '@ririd/eslint-config'

export default ririd({
  formatters: true,
  rules: {
    'ts/no-unsafe-function-type': 'off',
    'ts/no-unused-expressions': 'off',
    'eslint-comments/no-unlimited-disable': 'off',
  },
}, {
  files: ['**/*.md/**/*.html'],
  rules: {
    'format/prettier': 'off',
  },
})
