import { AppRoute } from './dsl';
import { StandardSchemaError } from './validation-error';

export class TsRestResponseValidationError extends Error {
  constructor(
    public appRoute: AppRoute,
    public cause: StandardSchemaError,
  ) {
    super(
      `[ts-rest] Response validation failed for ${appRoute.method} ${appRoute.path}: ${cause.message}`,
    );
  }
}
