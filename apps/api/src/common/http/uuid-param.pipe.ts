import { ParseUUIDPipe } from '@nestjs/common';
import { DomainError } from '../errors/domain-error.js';

/** Path identifier validation answering the error envelope with a field-specific code (BR6.3). */
export function uuidParam(name: string): ParseUUIDPipe {
  return new ParseUUIDPipe({
    exceptionFactory: () =>
      new DomainError('VALIDATION_FAILED', 'Invalid identifier', {
        details: [{ field: name, code: 'INVALID_UUID' }],
      }),
  });
}
