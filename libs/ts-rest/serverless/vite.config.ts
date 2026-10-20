import { defineConfig } from 'vite-plus';
import { libraryConfig } from '@ts-rest/build-config';

export default defineConfig(
  libraryConfig('serverless', {
    index: 'src/index.ts',
    zod3: 'src/zod3.ts',
    fetch: 'src/fetch.ts',
    aws: 'src/aws.ts',
    next: 'src/next.ts',
    azure: 'src/azure.ts',
  }),
);
