import { defineConfig } from 'vite-plus';

// These tests install real tarballs and run compilers in standalone consumers.
// Keep them separate from source unit tests and always run after native packing.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/{packaging,releases}/**/*.test.mjs'],
    testTimeout: 120000,
  },
});
