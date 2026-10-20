import { defineConfig } from 'vite-plus';
import swc from 'unplugin-swc';
export default defineConfig({
  plugins: [
    swc.vite({
      tsconfigFile: 'tsconfig.json',
      swcrc: false,
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2019',
      },
      module: { type: 'es6' },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
  },
  fmt: {
    singleQuote: true,
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'pnpm-lock.yaml',
    ],
  },
  lint: { ignorePatterns: ['node_modules/**', 'dist/**', 'coverage/**'] },
});
