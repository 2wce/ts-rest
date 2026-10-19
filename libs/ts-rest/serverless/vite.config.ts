import { defineConfig } from 'vite-plus';
import { libraryPack } from '../../../tools/vite/pack';

export default defineConfig({
  run: {
    tasks: {
      pack: {
        command: 'vp pack',
        dependsOn: [
          { task: 'pack', from: ['dependencies', 'devDependencies'] },
        ],
        cache: {
          input: [
            'src/**',
            'package.json',
            'vite.config.ts',
            'tsconfig*.json',
            'README.md',
            'CHANGELOG.md',
            { pattern: 'LICENCE', base: 'workspace' },
            { pattern: 'tools/vite/pack.ts', base: 'workspace' },
            { pattern: 'tsconfig.base.json', base: 'workspace' },
            { pattern: 'pnpm-lock.yaml', base: 'workspace' },
          ],
          output: [
            { pattern: 'dist/libs/ts-rest/serverless/**', base: 'workspace' },
          ],
        },
      },
    },
  },
  pack: libraryPack('serverless', {
    index: 'src/index.ts',
    fetch: 'src/fetch.ts',
    aws: 'src/aws.ts',
    next: 'src/next.ts',
    azure: 'src/azure.ts',
  }),
});
