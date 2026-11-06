import { vi } from 'vitest';
import {
  initContract,
  TsRestResponseValidationError as ResponseValidationError,
  TsRestResponseError,
  StandardSchemaV1,
  StandardSchemaError,
} from '@ts-restless/core';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  createNextRoute,
  createNextRouter,
  createSingleRouteHandler,
  RequestValidationError,
  TsRestRequestValidationError,
} from './ts-rest-next';
import { z } from 'zod';

// Applications can describe validation responses with their chosen validator.
const ValidationErrorSchema = z.object({
  name: z.literal('ValidationError'),
  issues: z.array(
    z
      .object({
        message: z.string(),
        path: z.array(z.union([z.string(), z.number()])).optional(),
      })
      .passthrough(),
  ),
});
const RequestValidationErrorSchema = ValidationErrorSchema;

const c = initContract();

const contract = c.router({
  get: {
    method: 'GET',
    path: '/test',
    query: c.type<{ test: string }>(),
    responses: {
      200: c.type<{ message: string }>(),
    },
  },
  getWithParams: {
    method: 'GET',
    path: `/test/:id`,
    query: null,
    responses: {
      200: c.type<{ id: string }>(),
      400: RequestValidationErrorSchema,
      404: z.object({
        message: z.literal('Not Found'),
      }),
      500: c.noBody(),
    },
  },
  getWithQuery: {
    method: 'GET',
    path: `/test-query`,
    query: c.type<{ test: string; foo: number }>(),
    responses: {
      200: c.type<{ test: string; foo: number }>(),
    },
  },
  noContent: {
    method: 'POST',
    path: '/no-content',
    body: c.noBody(),
    responses: {
      204: c.noBody(),
    },
  },
  advanced: {
    method: 'POST',
    path: `/advanced/:id`,
    body: c.type<{ test: string }>(),
    responses: {
      200: c.type<{ id: string; test: string }>(),
    },
    pathParams: z.object({
      id: z.string(),
    }),
  },
  getZodQuery: {
    method: 'GET',
    path: '/test/:id/:name',
    pathParams: z.object({
      id: z.string().transform(Number),
    }),
    query: z.object({
      field: z.string().optional(),
    }),
    responses: {
      200: z.object({
        id: z.number().lt(1000),
        name: z.string(),
        defaultValue: z.string().default('hello world'),
      }),
    },
  },
});

const nextEndpoint = createNextRoute(contract, {
  get: createNextRoute(contract.get, async ({ query: { test } }) => {
    return {
      status: 200,
      body: {
        message: test,
      },
    };
  }),
  getWithParams: async ({ params: { id } }) => {
    if (id === '500') {
      throw new TsRestResponseError(contract.getWithParams, {
        status: 500,
        body: undefined,
      });
    }

    if (id === '404') {
      throw new TsRestResponseError(contract.getWithParams, {
        status: 404,
        body: {
          message: 'Not Found',
        },
      });
    }

    return {
      status: 200,
      body: {
        id,
      },
    };
  },
  getWithQuery: async ({ query }) => {
    return {
      status: 200,
      body: {
        ...query,
      },
    };
  },
  noContent: async () => {
    return {
      status: 204,
      body: undefined,
    };
  },
  advanced: async ({ body: { test }, params: { id } }) => {
    return {
      status: 200,
      body: {
        id,
        test,
      },
    };
  },
  getZodQuery: async ({ params, query }) => {
    return {
      status: 200,
      body: {
        ...params,
        ...query,
      },
    };
  },
});

const jsonMock = vi.fn();
const sendMock = vi.fn();
const endMock = vi.fn();

const mockRes = {
  status: vi.fn(() => ({
    end: endMock,
    json: jsonMock,
    send: sendMock,
  })),
  setHeader: vi.fn(),
} as unknown as NextApiResponse;

describe.each(['router', 'single'] as const)(
  '%s response compatibility',
  (mode) => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    const request = () =>
      mode === 'router'
        ? mockReq('/response', { method: 'GET' })
        : mockSingleUrlReq('/response', { method: 'GET' });

    it.each([undefined, false, true])(
      'preserves JSON transforms and numeric status coercion (validation: %s)',
      async (responseValidation) => {
        const validate = vi.fn((value: unknown) => ({
          value: { wrapped: value },
        }));
        const schema: StandardSchemaV1<unknown, { wrapped: unknown }> = {
          '~standard': { version: 1, vendor: 'next-response-test', validate },
        };
        const router = c.router({
          get: { method: 'GET', path: '/response', responses: { 200: schema } },
        });
        const body = { original: true };
        const req = request();
        const implementation = async (context: {
          req: NextApiRequest;
          res: NextApiResponse;
        }) => {
          expect(context.req).toBe(req);
          expect(context.res).toBe(mockRes);
          // JavaScript callers can supply a string status; Next normalizes it.
          return { status: '200' as unknown as 200, body };
        };
        const handler =
          mode === 'router'
            ? createNextRouter(
                router,
                { get: implementation },
                { responseValidation },
              )
            : createSingleRouteHandler(router.get, implementation, {
                responseValidation,
              });

        await handler(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledExactlyOnceWith(
          responseValidation ? { wrapped: body } : body,
        );
        expect(validate).toHaveBeenCalledTimes(responseValidation ? 1 : 0);
        if (responseValidation) expect(validate).toHaveBeenCalledWith(body);
        expect(sendMock).not.toHaveBeenCalled();
        expect(endMock).not.toHaveBeenCalled();
        expect(mockRes.setHeader).not.toHaveBeenCalled();
      },
    );

    it.each([false, true])(
      'preserves text and thrown declared response transforms (validation: %s)',
      async (responseValidation) => {
        const validate = vi.fn((value: unknown) => ({
          value: String(value) + '!',
        }));
        const schema: StandardSchemaV1<string> = {
          '~standard': { version: 1, vendor: 'next-response-test', validate },
        };
        const router = c.router({
          get: {
            method: 'GET',
            path: '/response',
            responses: {
              400: c.otherResponse({ contentType: 'text/plain', body: schema }),
            },
          },
        });
        const implementation = async () => {
          throw new TsRestResponseError(router.get, {
            status: 400,
            body: 'input',
          });
        };
        const handler =
          mode === 'router'
            ? createNextRouter(
                router,
                { get: implementation },
                { responseValidation },
              )
            : createSingleRouteHandler(router.get, implementation, {
                responseValidation,
              });

        await handler(request(), mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.setHeader).toHaveBeenCalledExactlyOnceWith(
          'content-type',
          'text/plain',
        );
        expect(sendMock).toHaveBeenCalledExactlyOnceWith(
          responseValidation ? 'input!' : 'input',
        );
        expect(validate).toHaveBeenCalledTimes(responseValidation ? 1 : 0);
        expect(jsonMock).not.toHaveBeenCalled();
        expect(endMock).not.toHaveBeenCalled();
      },
    );

    it.each([false, true])(
      'passes undeclared statuses through without validation (validation: %s)',
      async (responseValidation) => {
        const validate = vi.fn(() => ({
          issues: [{ message: 'must not run' }],
        }));
        const schema: StandardSchemaV1 = {
          '~standard': { version: 1, vendor: 'next-response-test', validate },
        };
        const router = c.router({
          get: { method: 'GET', path: '/response', responses: { 200: schema } },
        });
        const implementation = async () => ({
          status: 202 as const,
          body: false,
        });
        const handler =
          mode === 'router'
            ? createNextRouter(
                router,
                { get: implementation },
                { responseValidation },
              )
            : createSingleRouteHandler(router.get, implementation, {
                responseValidation,
              });

        await handler(request(), mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(202);
        expect(jsonMock).toHaveBeenCalledExactlyOnceWith(false);
        expect(validate).not.toHaveBeenCalled();
        expect(mockRes.setHeader).not.toHaveBeenCalled();
        expect(sendMock).not.toHaveBeenCalled();
      },
    );

    it.each([false, true])(
      'ends a no-body response without JSON or text writes (validation: %s)',
      async (responseValidation) => {
        const router = c.router({
          get: {
            method: 'GET',
            path: '/response',
            responses: { 204: c.noBody() },
          },
        });
        const implementation = async () => ({
          status: 204 as const,
          body: undefined,
        });
        const handler =
          mode === 'router'
            ? createNextRouter(
                router,
                { get: implementation },
                { responseValidation },
              )
            : createSingleRouteHandler(router.get, implementation, {
                responseValidation,
              });

        await handler(request(), mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(204);
        expect(endMock).toHaveBeenCalledExactlyOnceWith();
        expect(jsonMock).not.toHaveBeenCalled();
        expect(sendMock).not.toHaveBeenCalled();
        expect(mockRes.setHeader).not.toHaveBeenCalled();
      },
    );

    it.each([false, true])(
      'preserves validation errors and callback context (custom handler: %s)',
      async (customHandler) => {
        const schema: StandardSchemaV1 = {
          '~standard': {
            version: 1,
            vendor: 'next-response-test',
            validate: () => ({
              issues: [{ message: 'invalid response', path: ['value'] }],
            }),
          },
        };
        const router = c.router({
          get: { method: 'GET', path: '/response', responses: { 200: schema } },
        });
        const implementation = async () => ({ status: 200 as const, body: {} });
        const errorHandler = vi.fn();
        const options = {
          responseValidation: true,
          errorHandler: customHandler ? errorHandler : undefined,
        };
        const handler =
          mode === 'router'
            ? createNextRouter(router, { get: implementation }, options)
            : createSingleRouteHandler(router.get, implementation, options);
        const req = request();
        let error: unknown;
        if (customHandler) {
          await handler(req, mockRes);
          expect(errorHandler).toHaveBeenCalledExactlyOnceWith(
            expect.any(ResponseValidationError),
            req,
            mockRes,
          );
          error = errorHandler.mock.calls[0][0];
        } else {
          error = await handler(req, mockRes).catch(
            (caught: unknown) => caught,
          );
        }
        expect(error).toBeInstanceOf(ResponseValidationError);
        const validationError = error as ResponseValidationError;
        expect(validationError.appRoute.responses).toBe(router.get.responses);
        expect(validationError.cause).toBeInstanceOf(StandardSchemaError);
        expect(validationError.cause.issues).toEqual([
          { message: 'invalid response', path: ['value'] },
        ]);
        expect(mockRes.status).not.toHaveBeenCalled();
        expect(jsonMock).not.toHaveBeenCalled();
        expect(sendMock).not.toHaveBeenCalled();
        expect(endMock).not.toHaveBeenCalled();
      },
    );

    it('passes asynchronous validator configuration errors to the callback', async () => {
      const schema: StandardSchemaV1 = {
        '~standard': {
          version: 1,
          vendor: 'next-response-test',
          validate: async (value) => ({ value }),
        },
      };
      const router = c.router({
        get: { method: 'GET', path: '/response', responses: { 200: schema } },
      });
      const implementation = async () => ({
        status: 200 as const,
        body: 'input',
      });
      const errorHandler = vi.fn();
      const options = { responseValidation: true, errorHandler };
      const handler =
        mode === 'router'
          ? createNextRouter(router, { get: implementation }, options)
          : createSingleRouteHandler(router.get, implementation, options);
      const req = request();

      await handler(req, mockRes);

      expect(errorHandler).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          message: 'Schema validation must be synchronous',
        }),
        req,
        mockRes,
      );
      expect(errorHandler.mock.calls[0][0]).not.toBeInstanceOf(
        ResponseValidationError,
      );
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it.each([false, true])(
      'preserves thrown native error identity (custom handler: %s)',
      async (customHandler) => {
        const router = c.router({
          get: { method: 'GET', path: '/response', responses: { 200: null } },
        });
        const error = new Error('native handler failed');
        const implementation = async () => {
          throw error;
        };
        const errorHandler = vi.fn();
        const options = {
          responseValidation: true,
          errorHandler: customHandler ? errorHandler : undefined,
        };
        const handler =
          mode === 'router'
            ? createNextRouter(router, { get: implementation }, options)
            : createSingleRouteHandler(router.get, implementation, options);
        const req = request();
        if (customHandler) {
          await handler(req, mockRes);
          expect(errorHandler).toHaveBeenCalledExactlyOnceWith(
            error,
            req,
            mockRes,
          );
        } else {
          await expect(handler(req, mockRes)).rejects.toBe(error);
        }
        expect(mockRes.status).not.toHaveBeenCalled();
      },
    );
  },
);

describe('strict mode', () => {
  const c = initContract();
  const postsRouter = c.router({
    getPost: {
      method: 'GET',
      path: `/posts/:id`,
      responses: {
        200: null,
      },
    },
  });

  it('allows unknown responses when not in strict mode', () => {
    const cLoose = c.router({ posts: postsRouter });
    createNextRoute(cLoose, {
      posts: {
        getPost: async () => ({ status: 201, body: null }),
      },
    });
  });

  it('does not allow unknown statuses when in strict mode', () => {
    const cStrict = c.router(
      { posts: postsRouter },
      { strictStatusCodes: true },
    );
    createNextRoute(cStrict, {
      posts: {
        // @ts-expect-error 201 is not defined as a known response
        getPost: async () => ({ status: 201, body: null }),
      },
    });
  });
});
describe('createNextRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should send back a 200', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/test', {
      method: 'GET',
      query: { test: 'test-query-string', foo: 123 },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'test-query-string',
    });
  });

  it('should send back a 404', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/wrong-url', {
      // <- Wrong URL
      method: 'GET',
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('should send back a 404', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/test', {
      method: 'POST', // <- Wrong method
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('should send body, params and query correctly', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/advanced/test-id', {
      method: 'POST',
      body: {
        test: 'test-body',
      },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: 'test-id',
      test: 'test-body',
    });
  });

  it('should send json query correctly', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint, {
      jsonQuery: true,
    });

    const req = mockReq('/test-query', {
      method: 'GET',
      query: { test: '"test-query-string"', foo: '123' },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      test: 'test-query-string',
      foo: 123,
    });
  });

  it('should differentiate between /test and /test/id', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/test/3', {
      method: 'GET',
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: '3',
    });
  });

  it('should handle no content', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/no-content', {
      method: 'POST',
      body: undefined,
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(jsonMock).toHaveBeenCalledTimes(0);
    expect(sendMock).toHaveBeenCalledTimes(0);
    expect(endMock).toHaveBeenCalled();
  });

  it('should handle thrown TsRestResponseError', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/test/404', {
      method: 'GET',
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Not Found',
    });
  });

  it('should handle thrown TsRestResponseError empty body', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/test/500', {
      method: 'GET',
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledTimes(0);
    expect(sendMock).toHaveBeenCalledTimes(0);
    expect(endMock).toHaveBeenCalled();
  });

  describe('response validation', () => {
    it('should include default value and removes extra field', async () => {
      const resultingRouter = createNextRouter(contract, nextEndpoint, {
        responseValidation: true,
      });

      const req = mockReq('/test/123/name', {
        method: 'GET',
        query: { field: 'foo' },
      });

      await resultingRouter(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        id: 123,
        name: 'name',
        defaultValue: 'hello world',
      });
    });

    it('fails with invalid field', async () => {
      const errorHandler = vi.fn();
      const resultingRouter = createNextRouter(contract, nextEndpoint, {
        responseValidation: true,
        errorHandler,
      });

      const req = mockReq('/test/2000/name', {
        method: 'GET',
      });

      await resultingRouter(req, mockRes);

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('request validation', () => {
    it('fails with invalid query type', async () => {
      const errorHandler = vi.fn();
      const resultingRouter = createNextRouter(contract, nextEndpoint, {
        throwRequestValidation: true,
        errorHandler,
      });

      const req = mockReq('/test/100/throw', {
        method: 'GET',
        query: { field: 42 },
      });

      await resultingRouter(req, mockRes);

      expect(errorHandler).toHaveBeenCalledWith(
        expect.any(TsRestRequestValidationError),
        expect.anything(),
        expect.anything(),
      );
      const error = errorHandler.mock.calls[0][0];
      expect(error).toBeInstanceOf(RequestValidationError);
      expect(error.query).toMatchObject({
        name: 'ValidationError',
        issues: [{ code: 'invalid_type', path: ['field'] }],
      });
      expect(error.pathParams).toBeNull();
      expect(error.headers).toBeNull();
      expect(error.body).toBeNull();
    });

    it('does not throw with invalid query type', async () => {
      const errorHandler = vi.fn();
      const resultingRouter = createNextRouter(contract, nextEndpoint, {
        throwRequestValidation: false,
        errorHandler,
      });

      const req = mockReq('/test/100/throw', {
        method: 'GET',
        query: { field: 42 },
      });

      await resultingRouter(req, mockRes);

      expect(errorHandler).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(
        RequestValidationErrorSchema.safeParse(jsonMock.mock.calls[0][0]),
      ).toStrictEqual({
        data: expect.any(Object),
        success: true,
      });
    });
  });

  it('should handle non-json response types from contract', async () => {
    const c = initContract();

    const contract = c.router({
      postIndex: {
        method: 'POST',
        path: `/index.html`,
        body: z.object({
          echoHtml: z.string(),
        }),
        responses: {
          200: c.otherResponse({
            contentType: 'text/html',
            body: z.string().regex(/^<([a-z][a-z0-9]*)\b[^>]*>(.*?)<\/\1>$/im),
          }),
        },
      },
      getRobots: {
        method: 'GET',
        path: `/robots.txt`,
        responses: {
          200: c.otherResponse({
            contentType: 'text/plain',
            body: c.type<string>(),
          }),
        },
      },
      getCss: {
        method: 'GET',
        path: '/style.css',
        responses: {
          200: c.otherResponse({
            contentType: 'text/css',
            body: c.type<string>(),
          }),
        },
      },
    });

    const router = createNextRouter(
      contract,
      {
        postIndex: async ({ body: { echoHtml } }) => {
          return {
            status: 200,
            body: echoHtml,
          };
        },
        getRobots: async () => {
          return {
            status: 200,
            body: 'User-agent: * Disallow: /',
          };
        },
        getCss: async () => {
          return {
            status: 200,
            body: 'body { color: red; }',
          };
        },
      },
      {
        responseValidation: true,
        errorHandler: (err: any, req, res) => {
          if (err instanceof ResponseValidationError) {
            res.status(500).send('Response validation failed');
            return;
          }
          res.status(500).send('Server Error');
        },
      },
    );

    let req = mockReq('/index.html', {
      method: 'POST',
      body: { echoHtml: '<h1>hello world</h1>' },
    });
    await router(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'text/html');
    expect(sendMock).toHaveBeenCalledWith('<h1>hello world</h1>');

    req = mockReq('/index.html', {
      method: 'POST',
      body: { echoHtml: 'hello world' },
    });
    await router(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(sendMock).toHaveBeenCalledWith('Response validation failed');

    req = mockReq('/robots.txt', { method: 'GET' });
    await router(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'content-type',
      'text/plain',
    );
    expect(sendMock).toHaveBeenCalledWith('User-agent: * Disallow: /');

    req = mockReq('/style.css', { method: 'GET' });
    await router(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'text/css');
    expect(sendMock).toHaveBeenCalledWith('body { color: red; }');
  });
});

describe('createSingleUrlNextRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send back a 200', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.getWithParams,
      nextEndpoint.getWithParams,
    );

    const req = mockSingleUrlReq('/test/123', {
      method: 'GET',
      query: { id: '123' },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: '123',
    });
  });

  it('should send back a 200 when the query params are in the URL', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.getWithParams,
      nextEndpoint.getWithParams,
    );

    const req = mockSingleUrlReq('/test/123?id=123', {
      method: 'GET',
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: '123',
    });
  });

  it('should send back a 404', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.getWithParams,
      nextEndpoint.getWithParams,
    );

    const req = mockSingleUrlReq('/wrong-url', {
      method: 'GET',
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('should send back a 404', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.getWithParams,
      nextEndpoint.getWithParams,
    );

    const req = mockSingleUrlReq('/test', {
      method: 'GET',
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('should send body, params and query correctly', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.advanced,
      nextEndpoint.advanced,
    );

    const req = mockSingleUrlReq('/advanced/123', {
      method: 'POST',
      body: {
        test: 'test-body',
      },
      query: { id: '123' },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: '123',
      test: 'test-body',
    });
  });

  it('should send json query correctly', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.getWithQuery,
      nextEndpoint.getWithQuery,
      { jsonQuery: true },
    );

    const req = mockSingleUrlReq('/test-query', {
      method: 'GET',
      query: { test: '"test-query-string"', foo: '123' },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      test: 'test-query-string',
      foo: 123,
    });
  });

  it('should differentiate between /test and /test/id', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.getWithParams,
      nextEndpoint.getWithParams,
    );

    const req = mockSingleUrlReq('/test/3', {
      method: 'GET',
      query: { id: '3' },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: '3',
    });
  });

  describe('response validation', () => {
    it('should include default value and removes extra field', async () => {
      const resultingRouter = createSingleRouteHandler(
        contract.getZodQuery,
        nextEndpoint.getZodQuery,
        { responseValidation: true },
      );

      const req = mockSingleUrlReq('/test/123/name', {
        method: 'GET',
        query: { field: 'foo', id: '123', name: 'name' },
      });

      await resultingRouter(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        id: 123,
        name: 'name',
        defaultValue: 'hello world',
      });
    });

    it('fails with invalid field', async () => {
      const errorHandler = vi.fn();
      const resultingRouter = createSingleRouteHandler(
        contract.getZodQuery,
        nextEndpoint.getZodQuery,
        { responseValidation: true, errorHandler },
      );

      const req = mockSingleUrlReq('/test/2000/name', {
        method: 'GET',
        query: { id: '2000', name: 'name' },
      });

      await resultingRouter(req, mockRes);

      expect(errorHandler).toHaveBeenCalled();
    });
  });
});

export const mockReq = (
  url: string,
  args: {
    query?: Record<string, unknown>;
    body?: unknown;
    method: string;
  },
): NextApiRequest => {
  const paramArray = url.split('/').splice(1);

  const req = {
    query: {
      ...args.query,
      ['ts-rest']: paramArray,
    },
    body: args.body,
    method: args.method,
  } as unknown as NextApiRequest;

  return req;
};

const mockSingleUrlReq = (
  url: string,
  args: { query?: Record<string, unknown>; body?: unknown; method: string },
): NextApiRequest => {
  const req = {
    url,
    query: args.query,
    body: args.body,
    method: args.method,
  } as unknown as NextApiRequest;

  return req;
};
