import { StandardSchemaV1 } from './standard-schema';

/**
 * The error class for standard schema validation errors.
 *
 * @see {@link StandardSchemaV1.FailureResult}
 */
export class StandardSchemaError
  extends Error
  implements StandardSchemaV1.FailureResult
{
  public readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(issues: ReadonlyArray<StandardSchemaV1.Issue>) {
    /**
     * Similar pattern to ZodError regarding bigints.
     */
    const message = JSON.stringify(
      issues,
      (_, value) => (typeof value === 'bigint' ? value.toString() : value),
      2,
    );

    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }

  /*
    ZodError overrides the toString method to return the serialised message.
    The Next.js implementation relies on this behaviour.
  */
  override toString() {
    return this.message;
  }
}

/*
  Convert a ValidationError to a plain object because ValidationError extends
  Error and causes problems with NestJS.
*/
export const validationErrorResponse = (
  error: StandardSchemaError,
): Pick<StandardSchemaError, 'name' | 'issues'> => {
  return {
    name: error.name,
    issues: error.issues,
  };
};
