import { randomUUID } from 'node:crypto';
import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import type { RequestWithTraceId } from '../http/trace-id.js';
import { isPrismaError } from '../prisma/prisma-errors.js';
import { DomainError, type ErrorDetails } from './domain-error.js';
import { ERROR_HTTP_STATUS, type ErrorCode } from './error-codes.js';

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
    traceId: string;
  };
}

export interface MappedError {
  status: number;
  code: ErrorCode;
  message: string;
  details?: ErrorDetails;
  headers: Record<string, string>;
  /** True when the failure is unexpected and must be logged with its cause. */
  unexpected: boolean;
}

const GENERIC_CLIENT_CODES: Partial<Record<number, ErrorCode>> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
};

const INTERNAL: MappedError = {
  status: ERROR_HTTP_STATUS.INTERNAL_ERROR,
  code: 'INTERNAL_ERROR',
  message: 'Internal error',
  headers: {},
  unexpected: true,
};

function fromClientStatus(status: number, message: string): MappedError {
  // Any other 4xx produced by the platform (e.g. 413, 415) is malformed input for the client.
  const code = GENERIC_CLIENT_CODES[status] ?? 'VALIDATION_FAILED';
  return { status: ERROR_HTTP_STATUS[code], code, message, headers: {}, unexpected: false };
}

function isParserError(error: unknown): error is { status: number; type: string } {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as { status?: unknown; type?: unknown };
  return typeof candidate.status === 'number' && typeof candidate.type === 'string';
}

/** BR6.1: maps any thrown value to the single envelope without leaking internals. */
export function mapException(exception: unknown): MappedError {
  if (exception instanceof DomainError) {
    return {
      status: exception.status,
      code: exception.code,
      message: exception.message,
      details: exception.details,
      headers: exception.headers,
      unexpected: exception.status >= 500,
    };
  }
  if (isPrismaError(exception)) {
    return INTERNAL;
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return status >= 500 ? INTERNAL : fromClientStatus(status, 'Request rejected');
  }
  if (isParserError(exception) && exception.status >= 400 && exception.status < 500) {
    return fromClientStatus(400, 'Malformed request body');
  }
  return INTERNAL;
}

export function toEnvelope(mapped: MappedError, traceId: string): ErrorEnvelope {
  const error: ErrorEnvelope['error'] = { code: mapped.code, message: mapped.message, traceId };
  if (mapped.details !== undefined) {
    error.details = mapped.details;
  }
  return { error };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithTraceId>();
    const response = http.getResponse<Response>();
    const traceId = request.traceId ?? randomUUID();
    const mapped = mapException(exception);

    if (mapped.unexpected) {
      const detail =
        exception instanceof Error ? (exception.stack ?? exception.message) : exception;
      this.logger.error(`Unexpected error (traceId=${traceId})`, detail);
    }

    response.status(mapped.status).set(mapped.headers).json(toEnvelope(mapped, traceId));
  }
}
