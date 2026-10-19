import { defineConfig } from 'vite-plus';
import swc from 'unplugin-swc';
import { resolve } from 'node:path';
import { decoratorOptions } from './tools/vite/swc';

const projects = [
  'core',
  'express',
  'fastify',
  'nest',
  'next',
  'open-api',
  'react-query',
  'react-query-v5',
  'serverless',
  'solid-query',
  'vue-query',
].map((name) => ({
  extends: true,
  plugins:
    name === 'nest'
      ? [
          swc.vite(
            decoratorOptions(resolve('libs/ts-rest/nest/tsconfig.lib.json')),
          ),
        ]
      : [],
  test: {
    name,
    root: resolve('libs/ts-rest', name),
    environment: ['react-query', 'react-query-v5', 'vue-query'].includes(name)
      ? 'jsdom'
      : undefined,
    setupFiles: [resolve('tools/vite/test-setup.ts')],
    testTimeout: name === 'fastify' ? 30000 : undefined,
  },
}));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{spec,test}.{ts,tsx}'],
    testTimeout: 10000,
    snapshotFormat: { escapeString: true, printBasicPrototype: true },
    projects: [
      ...projects,
      {
        extends: false,
        test: {
          name: 'non-strict-mode',
          globals: true,
          root: resolve('libs/non-strict-mode-test'),
          include: ['src/**/*.spec.ts'],
          environment: 'node',
        },
      },
      {
        extends: false,
        plugins: [
          swc.vite(decoratorOptions(resolve('tsconfig.base.json'), true)),
        ],
        test: {
          name: 'examples',
          globals: true,
          include: [
            'apps/**/*.{spec,test}.{ts,tsx}',
            'libs/example*/**/*.{spec,test}.{ts,tsx}',
          ],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'apps/example-azure-function/**',
            'apps/example-cloudflare-worker/**',
          ],
          environment: 'jsdom',
          passWithNoTests: true,
        },
      },
    ],
  },
  run: { cache: { scripts: true } },
  fmt: {
    singleQuote: true,
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: [
      '.nx/**',
      'apps/docs/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.vite/**',
      '**/.next/**',
      '.superpowers/**',
      'pnpm-lock.yaml',
    ],
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    plugins: ['typescript', 'react', 'import'],
    categories: { correctness: 'error' },
    overrides: [
      {
        files: ['libs/non-strict-mode-test/**'],
        rules: { 'typescript/no-useless-default-assignment': 'off' },
      },
      {
        files: ['**/*.spec.ts', '**/*.spec.tsx'],
        rules: {
          'no-unused-expressions': 'off',
          'typescript/unbound-method': 'off',
        },
      },
    ],
    rules: {
      // Roll out newly enabled type-aware rules as warnings for existing code.
      'typescript/await-thenable': 'warn',
      'typescript/no-base-to-string': 'warn',
      'typescript/restrict-template-expressions': 'warn',
      'typescript/unbound-method': 'warn',
      'typescript/no-floating-promises': 'warn',
      'typescript/no-redundant-type-constituents': 'warn',
      'typescript/no-useless-default-assignment': 'warn',
      'typescript/no-explicit-any': 'warn',
      'typescript/no-unused-vars': 'warn',
      'react/rules-of-hooks': 'error',
      'react/exhaustive-deps': 'warn',
      'react/set-state-in-effect': 'warn',
      'react/error-boundaries': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/apps/**'],
              message: 'Libraries must not import application code.',
            },
          ],
        },
      ],
    },
    ignorePatterns: [
      '.nx/**',
      'apps/docs/**',
      'test-projects/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.vite/**',
      '**/.next/**',
      '.superpowers/**',
    ],
  },
});
