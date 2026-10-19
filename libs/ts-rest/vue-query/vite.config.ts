import { defineConfig } from 'vite-plus';
import { libraryConfig } from '../../../tools/vite/library';

export default defineConfig(
  libraryConfig('vue-query', { index: 'src/index.ts' }),
);
