import { defineConfig } from 'vite-plus';
export default defineConfig({
  pack: {
    entry: { main: 'src/main.ts' },
    outDir: '../../dist/apps/example-express',
    format: 'cjs',
    target: 'node26',
    dts: false,
    tsconfig: 'tsconfig.app.json',
    deps: { neverBundle: true, alwaysBundle: [/^@ts-rest\//] },
  },
});
