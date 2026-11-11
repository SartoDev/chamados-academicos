import { Transform } from 'class-transformer';
import { ValidateIf } from 'class-validator';

/** Trims surrounding spaces of text input, so a blank name fails the non-empty rule. */
export function Trim(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}

/**
 * Query strings carry text: only "true" and "false" become booleans. Anything else is left
 * untouched so @IsBoolean reports it, instead of silently becoming true.
 */
export function ToBoolean(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return value;
  });
}

/** Optional field that, when sent, must be valid: null is rejected instead of ignored. */
export function IsOptionalDefined(): PropertyDecorator {
  return ValidateIf((_object: object, value: unknown) => value !== undefined);
}
