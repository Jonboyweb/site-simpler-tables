import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    rules: {
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'warn',
    },
  }),
]

export default eslintConfig