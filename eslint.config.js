import tseslint from 'typescript-eslint';
import globals from 'globals';
import js from '@eslint/js';

export default [
	{
		ignores: [
			'dist/',
			'node_modules/',
			'coverage/',
			'test-project/',
			'*.config.js',
			'*.config.ts',
			'bin/',
			'mcp-server/lib',
			'mcp-server/dist'
		]
	},

	// Base JS config
	{
		files: ['**/*.{js,mjs,cjs}'],
		...js.configs.recommended,
		languageOptions: {
			globals: {
				...globals.node
			}
		},
		rules: {
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'prefer-const': 'error',
			'no-var': 'error'
		}
	},

	// TypeScript specific config
	...tseslint.configs.strictTypeChecked.map((config) => ({
		...config,
		files: ['**/*.ts']
	})),

	{
		files: ['**/*.ts'],
		languageOptions: {
			parserOptions: {
				project: './tsconfig.eslint.json',
				tsconfigRootDir: import.meta.dirname
			},
			globals: {
				...globals.node
			}
		},
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_' }
			],
			'@typescript-eslint/no-non-null-assertion': 'warn'
			// These are important but disabled for now to get a baseline
			// '@typescript-eslint/no-floating-promises': 'error',
			// '@typescript-eslint/no-misused-promises': 'error',
		}
	},

	// Test files specific configuration
	{
		files: ['**/*.test.ts', '**/*.test.mjs', 'tests/**/*.ts'],
		languageOptions: {
			globals: {
				...globals.jest,
				...globals.node
			}
		}
	}
];
