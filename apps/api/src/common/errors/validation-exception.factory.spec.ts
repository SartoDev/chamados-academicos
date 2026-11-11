import { describe, expect, it } from '@jest/globals';
import { ValidationError } from 'class-validator';
import { DomainError } from './domain-error.js';
import {
  buildValidationDetails,
  validationExceptionFactory,
} from './validation-exception.factory.js';

function validationError(
  property: string,
  constraints?: Record<string, string>,
  children: ValidationError[] = [],
): ValidationError {
  return Object.assign(new ValidationError(), { property, constraints, children });
}

describe('validation exception factory (BR6.3)', () => {
  it('maps known constraints to specific field codes', () => {
    const details = buildValidationDetails([
      validationError('email', { isEmail: 'email must be an email', isNotEmpty: 'required' }),
      validationError('name', { maxLength: 'too long' }),
      validationError('role', { isEnum: 'invalid' }),
      validationError('sectorId', { isUuid: 'invalid' }),
    ]);

    expect(details).toEqual([
      { field: 'email', code: 'INVALID_EMAIL' },
      { field: 'email', code: 'REQUIRED' },
      { field: 'name', code: 'TOO_LONG' },
      { field: 'role', code: 'INVALID_VALUE' },
      { field: 'sectorId', code: 'INVALID_UUID' },
    ]);
  });

  it('uses the violated password rule as the field code', () => {
    expect(
      buildValidationDetails([
        validationError('password', { passwordPolicy: 'PASSWORD_MISSING_DIGIT' }),
      ]),
    ).toEqual([{ field: 'password', code: 'PASSWORD_MISSING_DIGIT' }]);
  });

  it('falls back to INVALID for constraints without a specific code', () => {
    expect(buildValidationDetails([validationError('page', { isDivisibleBy: 'no' })])).toEqual([
      { field: 'page', code: 'INVALID' },
    ]);
  });

  it('prefixes nested fields with the parent path', () => {
    const nested = validationError('filters', undefined, [
      validationError('from', { isInt: 'not an integer' }),
    ]);

    expect(buildValidationDetails([nested])).toEqual([
      { field: 'filters.from', code: 'INVALID_INTEGER' },
    ]);
  });

  it('builds a 400 VALIDATION_FAILED domain error with the details', () => {
    const error = validationExceptionFactory([validationError('active', { isBoolean: 'no' })]);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 400,
      details: [{ field: 'active', code: 'INVALID_BOOLEAN' }],
    });
  });
});
