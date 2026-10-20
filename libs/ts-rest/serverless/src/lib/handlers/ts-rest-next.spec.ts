import { initContract } from '@ts-rest/core';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createNextHandler } from './ts-rest-next';

const contract = initContract().router({
  getItem: {
    method: 'GET',
    path: '/items/:id',
    pathParams: z.object({ id: z.coerce.number() }),
    query: z.object({ label: z.string() }),
    responses: { 200: z.object({ id: z.number(), label: z.string() }) },
  },
});

for (const handlerType of ['app-router', 'pages-router-edge'] as const) {
  describe(`Next ${handlerType}`, () => {
    const handler = createNextHandler(
      contract,
      {
        getItem: async ({ params, query }) => ({
          status: 200,
          body: { ...params, ...query, extra: 'removed by validation' },
        }),
      },
      { basePath: '/api', handlerType, responseValidation: true },
    );

    const requestFor = (id: string, label?: string) => {
      const url = new URL(`http://localhost/api/items/${id}`);
      if (label !== undefined) url.searchParams.set('label', label);
      if (handlerType === 'pages-router-edge') {
        url.searchParams.append('ts-rest', 'items');
        url.searchParams.append('ts-rest', id);
      }
      return new NextRequest(url);
    };

    it('reads real NextRequest path/query values and validates the response', async () => {
      const response = await handler(requestFor('42', 'example'));
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain(
        'application/json',
      );
      expect(await response.json()).toEqual({ id: 42, label: 'example' });
    });

    it('rejects invalid request data', async () => {
      const response = await handler(requestFor('invalid'));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.pathParameterErrors.issues[0].path).toEqual(['id']);
      expect(body.queryParameterErrors.issues[0].path).toEqual(['label']);
    });
  });
}
