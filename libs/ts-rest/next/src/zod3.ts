/** Historical error constructors and payload schemas for Zod 3 only. */
import type { ZodError } from 'zod';
export { ZodErrorSchema as RequestValidationErrorSchema } from '@ts-rest/core/zod3';

export class RequestValidationError extends Error {
  constructor(
    public pathParams: ZodError | null,
    public headers: ZodError | null,
    public query: ZodError | null,
    public body: ZodError | null,
  ) {
    super('[ts-rest] request validation failed');
  }
}
