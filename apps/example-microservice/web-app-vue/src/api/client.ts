import { apiBlog } from '@ts-restless/example-contracts';
import { initQueryClient } from '@ts-restless/vue-query';

export const client = initQueryClient(apiBlog, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {
    'x-api-key': 'key',
  },
});
