const importOrder = [
  ['builtin', 'external'],
  'internal',
  ['unknown', 'sibling', 'parent', 'object', 'index'],
  'type'
]

module.exports = {
  root: true,
  env: {
    browser: false
  },
  extends: ['viki-ts', 'plugin:prettier/recommended'],
  rules: {
    camelcase: 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'import/order': [
      1,
      {
        'newlines-between': 'always',
        groups: importOrder,
        warnOnUnassignedImports: true,
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ]
  }
}
