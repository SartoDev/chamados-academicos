import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const TRACE_ID_HEADER = 'X-Trace-Id';

export interface RequestWithTraceId extends Request {
  traceId?: string;
}

/** Assigns a fresh trace id to every request; it is echoed in the error envelope and header. */
export function traceIdMiddleware(
  req: RequestWithTraceId,
  res: Response,
  next: NextFunction,
): void {
  const traceId = randomUUID();
  req.traceId = traceId;
  res.setHeader(TRACE_ID_HEADER, traceId);
  next();
}
