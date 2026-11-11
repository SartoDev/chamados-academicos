import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import { checkPasswordPolicy } from './password-policy.js';

export const PASSWORD_POLICY_CONSTRAINT = 'passwordPolicy';

/**
 * Validates BR3.4. The reported message is the first violated rule code (for example
 * PASSWORD_TOO_SHORT), which the validation exception factory exposes as the field code.
 */
export function IsPasswordPolicy(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: PASSWORD_POLICY_CONSTRAINT,
      target: target.constructor,
      propertyName: propertyName.toString(),
      options,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && checkPasswordPolicy(value).length === 0;
        },
        defaultMessage(args: ValidationArguments): string {
          if (typeof args.value !== 'string') {
            return 'INVALID_STRING';
          }
          return checkPasswordPolicy(args.value)[0] ?? 'INVALID';
        },
      },
    });
  };
}
