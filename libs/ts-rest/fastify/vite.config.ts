import { defineConfig } from 'vite-plus';
import { libraryConfig } from '../../../tools/vite/library';

export default defineConfig(
  libraryConfig('fastify', { index: 'src/index.ts' }),
);
