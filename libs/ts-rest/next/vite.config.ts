import { defineConfig } from 'vite-plus';
import { libraryConfig } from '../../../tools/vite/library';

export default defineConfig(libraryConfig('next', { index: 'src/index.ts' }));
