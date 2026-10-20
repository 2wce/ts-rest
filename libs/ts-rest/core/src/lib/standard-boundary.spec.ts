import { describe, expect, it } from 'vitest';
import { StandardSchemaV1 } from './standard-schema';
import { StandardSchemaError } from './validation-error';
import {
  mergeHeaderSchemasForRoute,
  validateIfSchema,
  validateMultiSchemaObject,
} from './standard-schema-utils';
import { z } from 'zod-legacy';

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

describe('explicit Standard Schema boundary', () => {
  it('rejects a supplied safeParse-only schema rather than mutating it or skipping validation', () => {
    const schema = z.string();
    expect(() => validateIfSchema('hello', schema)).toThrow(/Standard Schema/);
    expect('~standard' in schema).toBe(false);
  });

  it('combines opaque header schemas by validating both and merging their outputs', () => {
    const left: StandardSchemaV1 = {
      '~standard': {
        version: 1,
        vendor: 'left',
        validate: () => ({ value: { left: 1 } }),
      },
    };
    const right: StandardSchemaV1 = {
      '~standard': {
        version: 1,
        vendor: 'right',
        validate: () => ({ value: { right: 2 } }),
      },
    };
    expect(
      validateMultiSchemaObject(
        {},
        mergeHeaderSchemasForRoute(left, right) as StandardSchemaV1,
      ).value,
    ).toEqual({ left: 1, right: 2 });
  });

  it('preserves failures from both combined header schemas', () => {
    const left: StandardSchemaV1 = {
      '~standard': {
        version: 1,
        vendor: 'left',
        validate: () => ({
          issues: [{ message: 'Missing left', path: ['left'] }],
        }),
      },
    };
    const right: StandardSchemaV1 = {
      '~standard': {
        version: 1,
        vendor: 'right',
        validate: () => ({
          issues: [{ message: 'Missing right', path: ['right'] }],
        }),
      },
    };
    expect(
      validateMultiSchemaObject(
        {},
        mergeHeaderSchemasForRoute(left, right) as StandardSchemaV1,
      ).error?.issues,
    ).toEqual([
      { message: 'Missing left', path: ['left'] },
      { message: 'Missing right', path: ['right'] },
    ]);
  });
});
