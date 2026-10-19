import { defineConfig } from 'vite-plus';
import { nodePack } from '../../tools/vite/pack';
import swc from 'unplugin-swc';
import { decoratorOptions } from '../../tools/vite/swc';

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: 'vp pack',
        dependsOn: ['@ts-rest/example-database#generate'],
      },
      dev: {
        command: 'vp pack --watch --on-success "node dist/main.cjs"',
        dependsOn: ['@ts-rest/example-database#generate'],
        cache: false,
      },
    },
  },
  pack: {
    ...nodePack(),
    // Prisma locates its engine relative to the generated client package.
    deps: {
      neverBundle: true,
      alwaysBundle: [/^@ts-rest\/(?!example-database(?:\/|$))/],
    },
    plugins: [swc.rollup(decoratorOptions('tsconfig.json'))],
  },
});
