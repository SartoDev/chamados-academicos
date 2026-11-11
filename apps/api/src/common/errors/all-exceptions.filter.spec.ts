import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnauthorizedException,
  type ArgumentsHost,
} from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { AllExceptionsFilter, mapException, toEnvelope } from './all-exceptions.filter.js';
import { DomainError } from './domain-error.js';

function prismaError(code: string): Error {
  const error = new Error('Invalid `prisma.user.create()` invocation: internal detail');
  error.name = 'PrismaClientKnownRequestError';
  Object.assign(error, { code });
  return error;
}

describe('mapException (BR6.1)', () => {
  it('keeps code, status, details and headers of a domain error', () => {
    const error = new DomainError('AUTH_TOO_MANY_ATTEMPTS', 'Too many', {
      details: { retryAfterSeconds: 60 },
      headers: { 'Retry-After': '60' },
    });

    expect(mapException(error)).toEqual({
      status: 429,
      code: 'AUTH_TOO_MANY_ATTEMPTS',
      message: 'Too many',
      details: { retryAfterSeconds: 60 },
      headers: { 'Retry-After': '60' },
      unexpected: false,
    });
    expect(mapException(new DomainError('INTERNAL_ERROR', 'boom')).unexpected).toBe(true);
  });

  it('never exposes a Prisma error', () => {
    const mapped = mapException(prismaError('P2002'));

    expect(mapped).toMatchObject({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal error',
    });
    expect(mapped.details).toBeUndefined();
  });

  it.each([
    [new BadRequestException(), 400, 'VALIDATION_FAILED'],
    [new UnauthorizedException(), 401, 'UNAUTHENTICATED'],
    [new ForbiddenException(), 403, 'FORBIDDEN'],
    [new NotFoundException(), 404, 'NOT_FOUND'],
    [new PayloadTooLargeException(), 400, 'VALIDATION_FAILED'],
    [new ServiceUnavailableException(), 500, 'INTERNAL_ERROR'],
  ])('maps platform exception %p to %i %s', (exception, status, code) => {
    expect(mapException(exception as HttpException)).toMatchObject({ status, code });
  });

  it('maps body parser failures to VALIDATION_FAILED', () => {
    expect(mapException({ status: 400, type: 'entity.parse.failed' })).toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(mapException({ status: 413, type: 'entity.too.large' }).code).toBe('VALIDATION_FAILED');
  });

  it('maps anything else to INTERNAL_ERROR', () => {
    expect(mapException(new Error('unexpected')).code).toBe('INTERNAL_ERROR');
    expect(mapException('a string').code).toBe('INTERNAL_ERROR');
    expect(mapException(null).code).toBe('INTERNAL_ERROR');
    expect(mapException({ status: 500, type: 'stream.encoding.unsupported' }).code).toBe(
      'INTERNAL_ERROR',
    );
  });
});

describe('toEnvelope', () => {
  it('always carries code, message and traceId, and details only when present', () => {
    const withoutDetails = toEnvelope(mapException(new NotFoundException()), 'trace-1');
    const withDetails = toEnvelope(
      mapException(
        new DomainError('VALIDATION_FAILED', 'invalid', {
          details: [{ field: 'email', code: 'INVALID_EMAIL' }],
        }),
      ),
      'trace-2',
    );

    expect(withoutDetails).toEqual({
      error: { code: 'NOT_FOUND', message: 'Request rejected', traceId: 'trace-1' },
    });
    expect(withDetails.error.details).toEqual([{ field: 'email', code: 'INVALID_EMAIL' }]);
  });
});

describe('AllExceptionsFilter', () => {
  function hostFor(request: object) {
    const response = {
      statusCode: 0,
      headers: {} as Record<string, string>,
      body: undefined as unknown,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      set(headers: Record<string, string>) {
        Object.assign(this.headers, headers);
        return this;
      },
      json(body: unknown) {
        this.body = body;
        return this;
      },
    };
    const host = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
    } as unknown as ArgumentsHost;
    return { host, response };
  }

  it('writes the envelope with the request trace id and the error headers', () => {
    const { host, response } = hostFor({ traceId: 'trace-abc' });

    new AllExceptionsFilter().catch(
      new DomainError('AUTH_TOO_MANY_ATTEMPTS', 'Too many', { headers: { 'Retry-After': '30' } }),
      host,
    );

    expect(response.statusCode).toBe(429);
    expect(response.headers).toEqual({ 'Retry-After': '30' });
    expect(response.body).toEqual({
      error: { code: 'AUTH_TOO_MANY_ATTEMPTS', message: 'Too many', traceId: 'trace-abc' },
    });
  });

  it('logs unexpected errors and generates a trace id when the request has none', () => {
    const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { host, response } = hostFor({});

    new AllExceptionsFilter().catch(prismaError('P1001'), host);
    new AllExceptionsFilter().catch('not an error object', host);

    const body = response.body as { error: { code: string; traceId: string } };
    expect(response.statusCode).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.traceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(logError).toHaveBeenCalledTimes(2);
    logError.mockRestore();
  });
});
