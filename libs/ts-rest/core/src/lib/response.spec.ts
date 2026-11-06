import { AppRoute, initContract } from './dsl';
import { StandardSchemaV1 } from './standard-schema';
import { StandardSchemaError } from './validation-error';
import { evaluateResponse } from './response';

const c = initContract();
const route = (declaration: AppRoute['responses'][number]): AppRoute => ({
  method: 'GET',
  path: '/response',
  responses: { 200: declaration },
});
const makeSchema = (
  validate: StandardSchemaV1['~standard']['validate'],
): StandardSchemaV1 => ({
  '~standard': { version: 1, vendor: 'test', validate },
});

describe('response contract evaluation', () => {
  it.each([false, 0, '', null, undefined])(
    'preserves a successful schema output of %j',
    (body) => {
      const validate = vi.fn(() => ({ value: body }));
      expect(
        evaluateResponse({
          appRoute: route(makeSchema(validate)),
          response: { status: 200, body: 'input' },
          validateBody: true,
        }),
      ).toStrictEqual({
        success: true,
        metadata: { status: 200, bodyKind: 'value', contentType: undefined },
        body,
      });
      expect(validate).toHaveBeenCalledExactlyOnceWith('input');
    },
  );

  it.each([true, false])(
    'evaluates a wrapped declared error with validation=%s',
    (validateBody) => {
      const validate = vi.fn((value: unknown) => ({ value: `${value}!` }));
      const appRoute: AppRoute = {
        method: 'GET',
        path: '/error',
        responses: {
          400: c.otherResponse({
            contentType: 'text/plain',
            body: makeSchema(validate),
          }),
        },
      };
      expect(
        evaluateResponse({
          appRoute,
          response: { status: 400, body: 'bad' },
          validateBody,
        }),
      ).toStrictEqual({
        success: true,
        metadata: { status: 400, bodyKind: 'value', contentType: 'text/plain' },
        body: validateBody ? 'bad!' : 'bad',
      });
      expect(validate).toHaveBeenCalledTimes(validateBody ? 1 : 0);
    },
  );

  it.each([true, false])(
    'preserves a no-body payload and metadata with validation=%s',
    (validateBody) => {
      const body = { supplied: true };
      const appRoute: AppRoute = {
        method: 'GET',
        path: '/none',
        responses: { 204: c.noBody() },
      };
      const result = evaluateResponse({
        appRoute,
        response: { status: 204, body },
        validateBody,
      });
      expect(result).toStrictEqual({
        success: true,
        metadata: { status: 204, bodyKind: 'none', contentType: undefined },
        body,
      });
      if (result.success) expect(result.body).toBe(body);
    },
  );

  it.each([true, false])(
    'passes through type-only, null and undeclared responses with validation=%s',
    (validateBody) => {
      const appRoute: AppRoute = {
        method: 'GET',
        path: '/markers',
        responses: { 200: c.type<unknown>(), 201: null },
      };
      for (const status of [200, 201, 500]) {
        for (const body of [false, 0, '', null, undefined]) {
          expect(
            evaluateResponse({
              appRoute,
              response: { status, body },
              validateBody,
            }),
          ).toStrictEqual({
            success: true,
            metadata: { status, bodyKind: 'value', contentType: undefined },
            body,
          });
        }
      }
    },
  );

  it('does not invoke a throwing validator when disabled', () => {
    const validate = vi.fn(() => {
      throw new Error('Must not run');
    });
    const body = { original: true };
    const result = evaluateResponse({
      appRoute: route(makeSchema(validate)),
      response: { status: 200, body },
      validateBody: false,
    });
    expect(result).toStrictEqual({
      success: true,
      metadata: { status: 200, bodyKind: 'value', contentType: undefined },
      body,
    });
    if (result.success) expect(result.body).toBe(body);
    expect(validate).not.toHaveBeenCalled();
  });

  it('returns expected issues with metadata and no native exception', () => {
    const issues = [{ message: 'Rejected', path: ['value'] }];
    const validate = vi.fn(() => ({ issues }));
    const result = evaluateResponse({
      appRoute: route(
        c.otherResponse({
          contentType: 'text/plain',
          body: makeSchema(validate),
        }),
      ),
      response: { status: 200, body: 1 },
      validateBody: true,
    });
    expect(result.success).toBe(false);
    expect(result.metadata).toStrictEqual({
      status: 200,
      bodyKind: 'value',
      contentType: 'text/plain',
    });
    if (result.success) throw new Error('Expected validation failure');
    expect(result.error).toBeInstanceOf(StandardSchemaError);
    expect(result.error.issues).toEqual(issues);
    expect(validate).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('retains configuration errors and bypasses them when disabled', () => {
    const invalid = {} as AppRoute['responses'][number];
    const asynchronous = makeSchema(async (value) => ({ value }));
    for (const [declaration, message] of [
      [
        invalid,
        'Invalid schema supplied; use a Standard Schema or a contract type marker',
      ],
      [asynchronous, 'Schema validation must be synchronous'],
    ] as const) {
      expect(() =>
        evaluateResponse({
          appRoute: route(declaration),
          response: { status: 200, body: 'value' },
          validateBody: true,
        }),
      ).toThrow(message);
      expect(
        evaluateResponse({
          appRoute: route(declaration),
          response: { status: 200, body: 'value' },
          validateBody: false,
        }),
      ).toStrictEqual({
        success: true,
        metadata: { status: 200, bodyKind: 'value', contentType: undefined },
        body: 'value',
      });
    }
  });
});
