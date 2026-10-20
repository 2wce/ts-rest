import { defineConfig } from 'vite-plus';
import swc from 'unplugin-swc';
import { nodePack, decoratorOptions } from '@ts-rest/build-config';

export default defineConfig({
  pack: {
    ...nodePack(),
    plugins: [swc.rollup(decoratorOptions('tsconfig.json'))],
  },
});
