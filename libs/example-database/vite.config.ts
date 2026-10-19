import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      generate: {
        command: 'prisma generate',
        cache: {
          input: [
            'prisma/schema.prisma',
            'package.json',
            'vite.config.ts',
            { pattern: 'pnpm-lock.yaml', base: 'workspace' },
          ],
          output: ['generated/client/**'],
        },
      },
    },
  },
});
