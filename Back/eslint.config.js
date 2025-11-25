import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
	{
		ignores: ['dist/', 'node_modules/']
	},
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
				project: './tsconfig.json'
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				Buffer: 'readonly',
				module: 'readonly',
				require: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': tseslint,
			'import': importPlugin,
			'unused-imports': unusedImports
		},
		rules: {
			'indent': ['error', 'tab'],
			'quotes': ['error', 'single'],
			'semi': ['error', 'never'],
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': 'off',

			// Regras de imports
			'unused-imports/no-unused-imports': 'error',
			'unused-imports/no-unused-vars': ['warn', {
				'argsIgnorePattern': '^_'
			}],
			'import/order': ['error', {
				'groups': [
					'builtin',		// Node.js built-in modules
					'external',		// npm packages
					'internal',		// Absolute imports
					'parent',		// ../
					'sibling',		// ./
					'index'			// ./index
				],
				'newlines-between': 'always',
				'alphabetize': {
					'order': 'asc',
					'caseInsensitive': true
				}
			}],
			'import/newline-after-import': 'error',
			'import/no-duplicates': 'error'
		}
	}
]
