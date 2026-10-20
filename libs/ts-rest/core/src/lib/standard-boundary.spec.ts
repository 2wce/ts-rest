import { describe, expect, it } from 'vitest';
import { StandardSchemaV1 } from './standard-schema';
import { StandardSchemaError } from './validation-error';
import { validateIfSchema } from './standard-schema-utils';

describe('validator-independent validation', () => {
  it('validates and transforms a minimal Standard Schema without a validator library', () => {
    const schema: StandardSchemaV1<string, number> = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: (input) =>
          typeof input === 'string'
            ? { value: Number(input) }
            : { issues: [{ message: 'Expected a string', path: ['value'] }] },
      },
    };
    expect(validateIfSchema('12', schema).value).toBe(12);
    const failure = validateIfSchema(12, schema).error;
    expect(failure).toBeInstanceOf(StandardSchemaError);
    expect(failure?.issues).toEqual([
      { message: 'Expected a string', path: ['value'] },
    ]);
  });
});
