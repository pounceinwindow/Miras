import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
import refresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
export default tseslint.config(
  {
    ignores: [
      'dist',
      'fighting',
      'public/fighting',
      'public/ar/vendor',
      'node_modules',
      'supabase/functions',
      'test-results',
      'playwright-report',
      'android',
      'ios',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': hooks, 'react-refresh': refresh },
    rules: {
      ...hooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  { files: ['*.js', '**/*.mjs'], languageOptions: { globals: globals.node } },
  {
    files: ['public/ar/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
)
