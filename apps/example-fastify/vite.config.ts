import { defineConfig } from 'vite-plus';
import { nodePack } from '../../tools/vite/pack';

export default defineConfig({
  pack: nodePack(),
});
