import { defineConfig } from 'vite-plus';
export default defineConfig({
  pack: {
    entry: { main: 'src/functions/index.ts' },
    outDir: '../../dist/apps/example-azure-function',
    format: 'cjs',
    target: 'node26',
    dts: false,
    tsconfig: 'tsconfig.app.json',
    deps: { neverBundle: true, alwaysBundle: [/^@ts-rest\//] },
  },
});
