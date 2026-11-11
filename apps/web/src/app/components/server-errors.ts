import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../api/api-client';
import { messageForError, messageForFieldCode } from '../i18n/error-code-messages';

/**
 * Applies a server 400 to the form fields (BR6.3) and returns the message for the form alert,
 * or null when every problem was placed next to a field. Typed text is never cleared.
 */
export function applyServerError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_FAILED') {
    return messageForError(error);
  }
  let placedAll = error.fieldErrors.length > 0;
  for (const detail of error.fieldErrors) {
    if ((fields as readonly string[]).includes(detail.field)) {
      setError(detail.field as Path<T>, {
        type: 'server',
        message: messageForFieldCode(detail.code),
      });
    } else {
      placedAll = false;
    }
  }
  return placedAll ? null : messageForError(error);
}
