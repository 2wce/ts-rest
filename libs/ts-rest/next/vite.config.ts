import { defineConfig } from 'vite-plus';
import { libraryConfig } from '@ts-rest/build-config';

export default defineConfig(libraryConfig('next', { index: 'src/index.ts' }));
