import { defineConfig } from 'vite-plus';
import { nodePack } from '@ts-restless/build-config';

export default defineConfig({
  pack: nodePack('src/functions/index.ts'),
});
