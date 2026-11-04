import { TsRestResponseValidationError } from '@ts-rest/core';
import express, { ErrorRequestHandler } from 'express';
import supertest from 'supertest';
import {
  describeHttpConformance,
  httpContract,
  HttpHost,
  makeHttpHandlers,
  NativeInput,
  sendHttpRequest,
  TransformInput,
} from '../../../../../tests/conformance/http';
import { createExpressEndpoints, initServer } from './ts-rest-express';

describeHttpConformance(async (): Promise<HttpHost> => {
  const app = express();
  app.use(express.json());
  const inputs: TransformInput[] = [];
  const nativeInputs: NativeInput[] = [];
  const responseErrors: unknown[] = [];
  const handlers = makeHttpHandlers(inputs);
  const s = initServer();
  createExpressEndpoints(
    httpContract,
    s.router(httpContract, {
      ...handlers,
      transform: async (input) => {
        expect(input.req.res).toBe(input.res);
        expect(input.res.req).toBe(input.req);
        expect(input.req.tsRestRoute).toBe(httpContract.transform);
        nativeInputs.push({
          params: input.req.params,
          query: input.req.query,
          headers: input.req.headers,
          body: input.req.body,
        });
        return handlers.transform(input);
      },
    }),
    app,
    { logInitialization: false, responseValidation: true },
  );
  const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _req,
    res,
    _next,
  ) => {
    responseErrors.push(error);
    res.status(500).json({ message: 'response rejected by native middleware' });
  };
  app.use(errorHandler);

  return {
    inputs,
    nativeInputs,
    request: (input) => sendHttpRequest(supertest(app), input),
    // Supertest closes the temporary HTTP listener it opens for each request.
    close: async () => {},
    assertRequestError: (result, errors) => {
      const firstPath =
        errors.pathParams ?? errors.headers ?? errors.query ?? errors.body;
      expect(result.body).toMatchObject({
        name: 'ValidationError',
        issues: [expect.objectContaining({ path: [firstPath] })],
      });
      expect(result.body).not.toHaveProperty('pathParameterErrors');
    },
    assertResponseError: (result) => {
      expect(result.body).toEqual({
        message: 'response rejected by native middleware',
      });
      expect(responseErrors).toHaveLength(1);
      expect(responseErrors[0]).toBeInstanceOf(TsRestResponseValidationError);
      expect(responseErrors[0]).toMatchObject({
        appRoute: httpContract.invalidResponse,
        cause: {
          name: 'ValidationError',
          issues: [expect.objectContaining({ path: ['value'] })],
        },
      });
    },
  };
});
