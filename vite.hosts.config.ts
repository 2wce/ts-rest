import { defineConfig } from 'vite-plus';
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 60000,
    include: [
      'apps/example-azure-function/**/*.spec.ts',
      'apps/example-cloudflare-worker/**/*.spec.ts',
    ],
  },
});
