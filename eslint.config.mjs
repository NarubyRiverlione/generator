import eslintjs from '@eslint/js'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['dist', 'coverage', 'eslint.config.mjs'],
  },
  eslintjs.configs.recommended,
  ...typescriptEslint.configs.recommendedTypeChecked,
  reactPlugin.configs.flat.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        projectService: {
          allowDefaultProject: [
            'src/core/*.test.ts',
            'src/core/__tests__/*.test.ts',
            'src/core/__tests__/integration/*.test.ts',
            'src/core/__tests__/unit/*.test.ts',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['src/core/**/*.test.ts'],
    ...typescriptEslint.configs.disableTypeChecked,
  },
]
