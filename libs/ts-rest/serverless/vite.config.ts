import { defineConfig } from 'vite-plus';
import { libraryConfig } from '../../../tools/vite/library';

export default defineConfig(
  libraryConfig('serverless', {
    index: 'src/index.ts',
    fetch: 'src/fetch.ts',
    aws: 'src/aws.ts',
    next: 'src/next.ts',
    azure: 'src/azure.ts',
  }),
);
