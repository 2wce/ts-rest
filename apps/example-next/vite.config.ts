import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: 'next build',
        dependsOn: ['@ts-rest/example-database#generate'],
      },
      dev: {
        command: 'next dev',
        dependsOn: ['@ts-rest/example-database#generate'],
        cache: false,
      },
    },
  },
});
