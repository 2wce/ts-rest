import { defineConfig } from 'vite-plus';
import swc from 'unplugin-swc';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const paths = JSON.parse(readFileSync('tsconfig.base.json', 'utf8'))
  .compilerOptions.paths;
const alias = Object.entries(paths)
  .sort(([a], [b]) => b.length - a.length)
  .map(([find, files]) => ({
    find,
    replacement: resolve((files as string[])[0]),
  }));

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
  resolve: { alias },
  plugins:
    name === 'nest'
      ? [
          swc.vite({
            tsconfigFile: resolve('libs/ts-rest/nest/tsconfig.lib.json'),
            swcrc: false,
            jsc: {
              parser: { syntax: 'typescript', decorators: true },
              transform: { legacyDecorator: true, decoratorMetadata: true },
              target: 'es2019',
              keepClassNames: true,
            },
            module: { type: 'es6' },
          }),
        ]
      : [],
  test: {
    name,
    root: resolve('libs/ts-rest', name),
    globals: true,
    environment: ['react-query', 'react-query-v5', 'vue-query'].includes(name)
      ? 'jsdom'
      : 'node',
    include: ['src/**/*.{spec,test}.{ts,tsx}'],
    setupFiles: [resolve('tools/vite/test-setup.ts')],
    testTimeout: name === 'fastify' ? 30000 : 10000,
    snapshotFormat: { escapeString: true, printBasicPrototype: true },
  },
}));

export default defineConfig({
  test: {
    projects: [
      ...projects,
      {
        resolve: { alias },
        test: {
          name: 'non-strict-mode',
          globals: true,
          root: resolve('libs/non-strict-mode-test'),
          include: ['src/**/*.spec.ts'],
          environment: 'node',
        },
      },
      {
        resolve: { alias },
        plugins: [
          swc.vite({
            tsconfigFile: resolve('tsconfig.base.json'),
            swcrc: false,
            jsc: {
              parser: { syntax: 'typescript', decorators: true },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
                react: { runtime: 'automatic' },
              },
            },
            module: { type: 'es6' },
          }),
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
    plugins: ['typescript', 'react', 'import'],
    categories: { correctness: 'error' },
    overrides: [
      {
        files: ['**/*.spec.ts', '**/*.spec.tsx'],
        rules: { 'no-unused-expressions': 'off' },
      },
    ],
    rules: {
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
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.vite/**',
      '**/.next/**',
      '.superpowers/**',
    ],
  },
});
