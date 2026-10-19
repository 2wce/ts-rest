import { defineConfig } from 'vite-plus';
import solid from 'vite-plugin-solid';
export default defineConfig({
  plugins: [solid()],
  resolve: { tsconfigPaths: true },
  server: { port: 5005 },
  build: {
    target: 'es2019',
    outDir: '../../../dist/apps/example-microservice/web-app-solid',
  },
});
