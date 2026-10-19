import { defineConfig } from 'vite-plus';
import { libraryConfig } from '../../../tools/vite/library';

export default defineConfig(
  libraryConfig('open-api', { index: 'src/index.ts' }),
);
