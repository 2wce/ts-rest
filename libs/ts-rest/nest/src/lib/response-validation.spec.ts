import { type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  type AppRoute,
  initContract,
  StandardSchemaError,
} from '@ts-rest/core';
import { lastValueFrom, of } from 'rxjs';
import { z } from 'zod';
import { z as legacyZod } from 'zod-legacy';
import { TsRestAppRouteMetadataKey } from './constants';
import {
  TsRestHandlerInterceptor,
  TsRestResponseValidationError,
} from './ts-rest-nest-handler';

const c = initContract();

// Exercise the real interceptor and metadata reader at the Nest HTTP boundary.
const executeResponse = async (
  appRoute: AppRoute,
  body: unknown,
  status = 200,
) => {
  const handler = () => undefined;
  class TestController {}
  Reflect.defineMetadata(
    TsRestAppRouteMetadataKey,
    { appRoute, routeKey: null },
    handler,
  );
  const response = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    status(value: number) {
      this.statusCode = value;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
  };
  const context = {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => ({ params: {}, query: {}, headers: {} }),
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
  const interceptor = new TsRestHandlerInterceptor(new Reflector(), {
    validateResponses: true,
  });
  const value = await lastValueFrom(
    interceptor.intercept(context, {
      handle: () => of(async () => ({ status, body })),
    }),
  );
  return {
    status: response.statusCode,
    headers: response.headers,
    body: value,
  };
};

describe('Nest response validation boundary', () => {
  it.each([false, true])(
    'rejects invalid response bodies with modern issues (otherResponse: %s)',
    async (wrapped) => {
      const schema = z.object({ value: z.string() });
      const route: AppRoute = {
        method: 'GET',
        path: '/response',
        responses: {
          200: wrapped
            ? c.otherResponse({
                contentType: 'application/problem+json',
                body: schema,
              })
            : schema,
        },
      };
      const result = executeResponse(route, { value: 123 });
      await expect(result).rejects.toBeInstanceOf(
        TsRestResponseValidationError,
      );
      await expect(result).rejects.toMatchObject({
        appRoute: route,
        error: expect.any(StandardSchemaError),
      });
      await expect(result).rejects.toMatchObject({
        error: {
          name: 'ValidationError',
          issues: [
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['value'],
              message: 'Expected string, received number',
            },
          ],
        },
      });
    },
  );

  it('applies a wrapped response body transform and preserves its content type and status', async () => {
    const route: AppRoute = {
      method: 'GET',
      path: '/response',
      responses: {
        202: c.otherResponse({
          contentType: 'text/plain',
          body: z.string().transform((value) => value.toUpperCase()),
        }),
      },
    };
    await expect(executeResponse(route, 'accepted', 202)).resolves.toEqual({
      status: 202,
      headers: { 'content-type': 'text/plain' },
      body: 'ACCEPTED',
    });
  });

  it('rejects an unbridged pre-Standard-Schema Zod response instead of bypassing validation', async () => {
    const route: AppRoute = {
      method: 'GET',
      path: '/response',
      responses: {
        // @ts-expect-error Old Zod must also be rejected when supplied by untyped runtime code.
        200: legacyZod.object({ value: legacyZod.string() }),
      },
    };
    await expect(executeResponse(route, { value: 123 })).rejects.toThrow(
      'Invalid schema supplied; use a Standard Schema or a contract type marker',
    );
  });

  it.each([
    {
      schema: c.type<{ value: string }>(),
      body: { value: 'typed' },
      status: 200,
    },
    { schema: c.noBody(), body: undefined, status: 204 },
  ] as const)(
    'preserves a contract marker response with status $status',
    async ({ schema, body, status }) => {
      const route: AppRoute = {
        method: 'GET',
        path: '/response',
        responses: { [status]: schema },
      };
      await expect(executeResponse(route, body, status)).resolves.toEqual({
        status,
        headers: {},
        body,
      });
    },
  );

  it('continues to reject a response status without a declared schema', async () => {
    const route: AppRoute = {
      method: 'GET',
      path: '/response',
      responses: { 200: c.type<string>() },
    };
    await expect(executeResponse(route, 'undeclared', 201)).rejects.toThrow(
      "Couldn't find a response schema for 201",
    );
  });
});
