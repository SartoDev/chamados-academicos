import type { ValidationError } from 'class-validator';
import { PASSWORD_POLICY_CONSTRAINT } from '../validation/is-password-policy.decorator.js';
import { DomainError, type FieldErrorDetail } from './domain-error.js';

const CONSTRAINT_CODES: Record<string, string> = {
  isDefined: 'REQUIRED',
  isNotEmpty: 'REQUIRED',
  isString: 'INVALID_STRING',
  isEmail: 'INVALID_EMAIL',
  minLength: 'TOO_SHORT',
  maxLength: 'TOO_LONG',
  isEnum: 'INVALID_VALUE',
  isIn: 'INVALID_VALUE',
  isUuid: 'INVALID_UUID',
  isBoolean: 'INVALID_BOOLEAN',
  isInt: 'INVALID_INTEGER',
  min: 'OUT_OF_RANGE',
  max: 'OUT_OF_RANGE',
};

const FALLBACK_FIELD_CODE = 'INVALID';

function codeForConstraint(constraint: string, message: string): string {
  if (constraint === PASSWORD_POLICY_CONSTRAINT) {
    // The password policy validator reports the violated rule as its message.
    return message;
  }
  return CONSTRAINT_CODES[constraint] ?? FALLBACK_FIELD_CODE;
}

/** BR6.3: one detail per violated constraint, with the field path and a specific code. */
export function buildValidationDetails(
  errors: ValidationError[],
  parentPath = '',
): FieldErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(([constraint, message]) => ({
      field,
      code: codeForConstraint(constraint, message),
    }));
    const nested = error.children?.length ? buildValidationDetails(error.children, field) : [];
    return [...own, ...nested];
  });
}

export function validationExceptionFactory(errors: ValidationError[]): DomainError {
  return new DomainError('VALIDATION_FAILED', 'Request validation failed', {
    details: buildValidationDetails(errors),
  });
}
