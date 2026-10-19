import { defineConfig } from 'vite-plus';
import { nodePack } from '../../../tools/vite/pack';
import swc from 'unplugin-swc';
import { decoratorOptions } from '../../../tools/vite/swc';

export default defineConfig({
  pack: {
    ...nodePack(),
    plugins: [swc.rollup(decoratorOptions('tsconfig.json'))],
  },
});
