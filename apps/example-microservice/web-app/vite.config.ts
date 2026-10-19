import { defineConfig } from 'vite-plus';
export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: { port: 5004 },
  build: {
    target: 'es2019',
    outDir: '../../../dist/apps/example-microservice/web-app',
  },
});
