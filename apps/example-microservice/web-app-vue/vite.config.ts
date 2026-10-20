import { defineConfig } from 'vite-plus';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue()],
  server: { port: 5006 },
  build: {
    target: 'es2019',
  },
});
