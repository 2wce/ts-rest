import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      'build-app': {
        command: 'next build',
        dependsOn: ['@ts-rest/example-database#generate'],
      },
      'dev-app': {
        command: 'next dev',
        dependsOn: ['@ts-rest/example-database#generate'],
        cache: false,
      },
    },
  },
});
