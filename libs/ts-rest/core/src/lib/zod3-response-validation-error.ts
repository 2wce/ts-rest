import type { ZodError } from 'zod';
import type { AppRoute } from './dsl';

/**
 * @deprecated use TsRestResponseValidationError instead, this will be removed in v4
 */
export class ResponseValidationError extends Error {
  constructor(
    public appRoute: AppRoute,
    public cause: ZodError,
  ) {
    super(
      `[ts-rest] Response validation failed for ${appRoute.method} ${appRoute.path}: ${cause.message}`,
    );
  }
}
