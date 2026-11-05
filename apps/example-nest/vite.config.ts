import { defineConfig } from 'vite-plus';
import swc from 'unplugin-swc';
import { nodePack, decoratorOptions } from '@ts-restless/build-config';

export default defineConfig({
  run: {
    tasks: {
      'build-app': {
        command: 'vp pack',
        dependsOn: ['@ts-restless/example-database#generate'],
      },
      'dev-app': {
        command: 'vp pack --watch --on-success "node dist/main.cjs"',
        dependsOn: ['@ts-restless/example-database#generate'],
        cache: false,
      },
    },
  },
  pack: {
    ...nodePack(),
    // Prisma locates its engine relative to the generated client package.
    deps: {
      neverBundle: true,
      alwaysBundle: [/^@ts-restless\/(?!example-database(?:\/|$))/],
    },
    plugins: [swc.rollup(decoratorOptions('tsconfig.json'))],
  },
});
