import { defineConfig } from 'vite-plus';
import swc from 'unplugin-swc';
export default defineConfig({
  pack: {
    entry: { main: 'src/main.ts' },
    outDir: '../../dist/apps/example-nest',
    format: 'cjs',
    target: 'node26',
    dts: false,
    tsconfig: 'tsconfig.app.json',
    deps: { neverBundle: true, alwaysBundle: [/^@ts-rest\//] },
    plugins: [
      swc.rollup({
        tsconfigFile: 'tsconfig.app.json',
        swcrc: false,
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
          target: 'es2019',
        },
        module: { type: 'es6' },
      }),
    ],
  },
});
