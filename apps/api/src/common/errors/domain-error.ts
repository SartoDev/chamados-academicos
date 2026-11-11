import { ERROR_HTTP_STATUS, type ErrorCode } from './error-codes.js';

export interface FieldErrorDetail {
  field: string;
  code: string;
}

export type ErrorDetails = FieldErrorDetail[] | Record<string, unknown>;

export interface DomainErrorOptions {
  details?: ErrorDetails;
  headers?: Record<string, string>;
}

/**
 * Expected failure with a stable code. The global exception filter turns it into the
 * single error envelope; the message is a debugging fallback, never shown to the user.
 */
export class DomainError extends Error {
  readonly status: number;
  readonly details?: ErrorDetails;
  readonly headers: Record<string, string>;

  constructor(
    readonly code: ErrorCode,
    message: string,
    options: DomainErrorOptions = {},
  ) {
    super(message);
    this.name = 'DomainError';
    this.status = ERROR_HTTP_STATUS[code];
    this.details = options.details;
    this.headers = options.headers ?? {};
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
