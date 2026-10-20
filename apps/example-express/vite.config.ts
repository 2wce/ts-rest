import { defineConfig } from 'vite-plus';
import { nodePack } from '@ts-rest/build-config';

export default defineConfig({
  pack: nodePack(),
});
