import { defineConfig } from 'vite-plus';
import { libraryConfig } from '@ts-restless/build-config';

export default defineConfig(
  libraryConfig('solid-query', { index: 'src/index.ts' }),
);
