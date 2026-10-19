import { defineConfig } from 'vite-plus';
import { libraryConfig } from '../../../tools/vite/library';

export default defineConfig(libraryConfig('nest', { index: 'src/index.ts' }));
