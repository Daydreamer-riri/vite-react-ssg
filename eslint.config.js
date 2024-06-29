import ririd from '@ririd/eslint-config'

export default ririd({
  formatters: true,
}, {
  files: ['**/*.md/**/*.html'],
  rules: {
    'format/prettier': 'off',
  },
})
