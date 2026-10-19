import { defineConfig } from 'vite-plus';
export default defineConfig({
  server: { port: 5004 },
  build: {
    target: 'es2019',
    outDir: '../../../dist/apps/example-microservice/web-app',
  },
});
