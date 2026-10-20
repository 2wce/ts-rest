import { defineConfig } from 'vite-plus';
import { libraryConfig } from '@ts-rest/build-config';

export default defineConfig(
  libraryConfig('core', { index: 'src/index.ts', zod3: 'src/zod3.ts' }),
);
