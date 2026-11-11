export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordPolicyViolation =
  'PASSWORD_TOO_SHORT' | 'PASSWORD_TOO_LONG' | 'PASSWORD_MISSING_LETTER' | 'PASSWORD_MISSING_DIGIT';

const LETTER_PATTERN = /\p{L}/u;
const DIGIT_PATTERN = /[0-9]/;

/**
 * BR3.4: 8 to 128 characters, at least one letter and at least one digit.
 * Returns every violated constraint so callers can report a field-specific code.
 */
export function checkPasswordPolicy(password: string): PasswordPolicyViolation[] {
  const violations: PasswordPolicyViolation[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    violations.push('PASSWORD_TOO_SHORT');
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    violations.push('PASSWORD_TOO_LONG');
  }
  if (!LETTER_PATTERN.test(password)) {
    violations.push('PASSWORD_MISSING_LETTER');
  }
  if (!DIGIT_PATTERN.test(password)) {
    violations.push('PASSWORD_MISSING_DIGIT');
  }
  return violations;
}

export function satisfiesPasswordPolicy(password: string): boolean {
  return checkPasswordPolicy(password).length === 0;
}
