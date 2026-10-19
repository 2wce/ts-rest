import { defineConfig } from 'vite-plus';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue()],
  resolve: { tsconfigPaths: true },
  server: { port: 5006 },
  build: {
    target: 'es2019',
    outDir: '../../../dist/apps/example-microservice/web-app-vue',
  },
});
