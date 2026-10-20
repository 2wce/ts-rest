import { z } from 'zod';
import { ZodErrorSchema } from './zod-utils';

/**
 * Schema was added in https://github.com/ts-rest/ts-rest/pull/601
 *
 * @deprecated supports zod 3, does not support other validators, you can bring your own schema, from next major version this will be removed
 */
export const RequestValidationErrorSchema = z.object({
  message: z.literal('Request validation failed'),
  pathParameterErrors: ZodErrorSchema.nullable(),
  headerErrors: ZodErrorSchema.nullable(),
  queryParameterErrors: ZodErrorSchema.nullable(),
  bodyErrors: ZodErrorSchema.nullable(),
});

/**
 * Schema was added in https://github.com/ts-rest/ts-rest/pull/601
 *
 * @deprecated supports zod 3, does not support other validators, you can bring your own schema, from next major version this will be removed
 */
export const RequestValidationErrorSchemaWithoutMessage = z.object({
  // No message, express never had this implemented
  pathParameterErrors: ZodErrorSchema.nullable(),
  headerErrors: ZodErrorSchema.nullable(),
  queryParameterErrors: ZodErrorSchema.nullable(),
  bodyErrors: ZodErrorSchema.nullable(),
});

/**
 * Schema was added in https://github.com/ts-rest/ts-rest/pull/601
 *
 * @deprecated supports zod 3, does not support other validators, you can bring your own schema, from next major version this will be removed
 */
export const RequestValidationErrorSchemaForNest = z.object({
  paramsResult: ZodErrorSchema.nullable(),
  headersResult: ZodErrorSchema.nullable(),
  queryResult: ZodErrorSchema.nullable(),
  bodyResult: ZodErrorSchema.nullable(),
});
