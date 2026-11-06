import {
  AppRoute,
  StandardSchemaV1,
  StandardSchemaError,
  initContract,
  TsRestResponseValidationError,
  validateResponse,
} from '..';
import { z } from 'zod';

const c = initContract();
const contract = c.router(
  {
    plainResponse: {
      method: 'GET',
      path: `/plain`,
      responses: {
        200: c.type<{ foo: string }>(),
      },
    },
    zodResponse: {
      method: 'GET',
      path: '/zod',
      responses: {
        200: z.object({
          foo: z.string().transform((val) => val.toUpperCase()),
        }),
      },
    },
    overrideCommonResponse: {
      method: 'GET',
      path: '/override-common',
      responses: {
        200: z.object({
          foo: z.string(),
        }),
        400: z.object({
          foo: z.string(),
        }),
      },
    },
  },
  {
    commonResponses: {
      400: z.object({
        message: z.literal('Bad Request'),
      }),
      404: z.object({
        message: z.literal('Not Found'),
      }),
    },
  },
);

describe('server', () => {
  it('succeeds validation on plain type', () => {
    const validatedResponse = validateResponse({
      appRoute: contract.plainResponse,
      response: {
        status: 200,
        body: { anything: 'foo' },
      },
    });

    expect(validatedResponse).toEqual({
      status: 200,
      body: { anything: 'foo' },
    });
  });

  it('succeeds validation on non-existent status code', () => {
    const validatedResponse = validateResponse({
      appRoute: contract.plainResponse,
      response: {
        status: 500,
        body: { anything: 'foo' },
      },
    });

    expect(validatedResponse).toEqual({
      status: 500,
      body: { anything: 'foo' },
    });
  });

  it('succeeds validation on zod response', () => {
    const validatedResponse = validateResponse({
      appRoute: contract.zodResponse,
      response: {
        status: 200,
        body: { foo: 'bar' },
      },
    });

    expect(validatedResponse).toEqual({
      status: 200,
      body: { foo: 'BAR' },
    });
  });

  it('fails validation on zod response', () => {
    expect(() => {
      validateResponse({
        appRoute: contract.zodResponse,
        response: {
          status: 200,
          body: { bar: 'foo' },
        },
      });
    }).toThrow(TsRestResponseValidationError);
  });

  it('succeeds validation on zod common response', () => {
    const validatedResponse = validateResponse({
      appRoute: contract.plainResponse,
      response: {
        status: 400,
        body: { message: 'Bad Request' },
      },
    });

    expect(validatedResponse).toEqual({
      status: 400,
      body: { message: 'Bad Request' },
    });
  });

  it('fails validation on zod common response', () => {
    expect(() => {
      validateResponse({
        appRoute: contract.plainResponse,
        response: {
          status: 400,
          body: { message: 'not bad request' },
        },
      });
    }).toThrow(TsRestResponseValidationError);
  });

  it('succeeds validation on overridden zod common response', () => {
    const validatedResponse = validateResponse({
      appRoute: contract.overrideCommonResponse,
      response: {
        status: 400,
        body: { foo: 'bar' },
      },
    });

    expect(validatedResponse).toEqual({
      status: 400,
      body: { foo: 'bar' },
    });
  });

  it('fails validation on overridden zod common response', () => {
    expect(() => {
      validateResponse({
        appRoute: contract.overrideCommonResponse,
        response: {
          status: 400,
          body: { message: 'Bad Request' },
        },
      });
    }).toThrow(TsRestResponseValidationError);
  });
});

describe('response facade compatibility', () => {
  it.each([null, undefined, {}, { status: '200' }])(
    'returns a non-response value unchanged: %j',
    (value) => {
      const response = value as unknown as Parameters<
        typeof validateResponse
      >[0]['response'];
      expect(
        validateResponse({ appRoute: contract.plainResponse, response }),
      ).toBe(value);
    },
  );

  it('retains a supplied body for a no-body declaration', () => {
    const appRoute: AppRoute = {
      method: 'GET',
      path: '/none',
      responses: { 204: c.noBody() },
    };
    const body = { supplied: true };
    const result = validateResponse({
      appRoute,
      response: { status: 204, body },
    });
    expect(result).toStrictEqual({ status: 204, body });
    expect(result.body).toBe(body);
  });

  it('transforms a wrapped declared error once and returns only status/body', () => {
    const validate = vi.fn((value: unknown) => ({ value: `${value}!` }));
    const schema: StandardSchemaV1<unknown, string> = {
      '~standard': { version: 1, vendor: 'test', validate },
    };
    const appRoute: AppRoute = {
      method: 'GET',
      path: '/error',
      responses: {
        400: c.otherResponse({ contentType: 'text/plain', body: schema }),
      },
    };
    expect(
      validateResponse({ appRoute, response: { status: 400, body: 'bad' } }),
    ).toStrictEqual({ status: 400, body: 'bad!' });
    expect(validate).toHaveBeenCalledExactlyOnceWith('bad');
  });

  it('keeps the public error class and route/cause fields', () => {
    const issues = [{ message: 'Rejected', path: ['value'] }];
    const schema: StandardSchemaV1 = {
      '~standard': { version: 1, vendor: 'test', validate: () => ({ issues }) },
    };
    const appRoute: AppRoute = {
      method: 'GET',
      path: '/invalid',
      responses: { 200: schema },
    };
    let caught: unknown;
    try {
      validateResponse({ appRoute, response: { status: 200, body: 1 } });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(TsRestResponseValidationError);
    if (!(caught instanceof TsRestResponseValidationError)) {
      throw new Error('Expected the public response-validation error');
    }
    expect(caught.appRoute).toBe(appRoute);
    expect(caught.cause).toBeInstanceOf(StandardSchemaError);
    expect(caught.cause.issues).toEqual(issues);
    expect(caught.message).toBe(
      `[ts-rest] Response validation failed for GET /invalid: ${caught.cause.message}`,
    );
  });
});
