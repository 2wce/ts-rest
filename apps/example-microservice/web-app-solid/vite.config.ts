import { defineConfig } from 'vite-plus';
import solid from 'vite-plugin-solid';
export default defineConfig({
  plugins: [solid()],
  server: { port: 5005 },
  build: {
    target: 'es2019',
  },
});
