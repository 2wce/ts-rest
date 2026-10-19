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
          output: [{ pattern: 'dist/libs/ts-rest/next/**', base: 'workspace' }],
        },
      },
    },
  },
  pack: libraryPack('next', { index: 'src/index.ts' }),
});
