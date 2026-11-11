import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { json, type ErrorRequestHandler } from 'express';
import {
  AllExceptionsFilter,
  mapException,
  toEnvelope,
} from './common/errors/all-exceptions.filter.js';
import { validationExceptionFactory } from './common/errors/validation-exception.factory.js';
import { traceIdMiddleware, type RequestWithTraceId } from './common/http/trace-id.js';

// The leading slash matters: NestJS mounts its unknown-route handler with the raw prefix, and
// Express 5 never matches a mount path without it, which would bypass the error envelope.
export const API_PREFIX = '/api/v1';
const JSON_BODY_LIMIT = '100kb';

/** Turns body parser failures (malformed JSON, oversized body) into the error envelope. */
const bodyParserErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const mapped = mapException(error);
  const traceId = (req as RequestWithTraceId).traceId ?? '';
  res.status(mapped.status).json(toEnvelope(mapped, traceId));
};

/**
 * Cross-cutting HTTP conventions of X-01, shared by the running server and the integration
 * tests so both exercise exactly the same pipeline. The app must be created with
 * `bodyParser: false`, because the JSON parser is registered here with its error handler.
 */
export function configureApp(app: NestExpressApplication): void {
  app.disable('x-powered-by');
  app.setGlobalPrefix(API_PREFIX);
  app.use(traceIdMiddleware);
  app.use(cookieParser());
  app.use(json({ limit: JSON_BODY_LIMIT }));
  app.use(bodyParserErrorHandler);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
