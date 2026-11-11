import { expect } from '@jest/globals';
import request, { type Response } from 'supertest';
import { SESSION_COOKIE_NAME } from '../../../../src/auth/session-cookie.js';
import { TokenService } from '../../../../src/auth/token.service.js';
import type { TestApp } from './test-app.js';

export const API = '/api/v1';

export function http(testApp: TestApp) {
  return request(testApp.app.getHttpServer());
}

/** Cookie header of a valid session for the user, issued with the application's own clock. */
export function sessionCookie(testApp: TestApp, userId: string): string {
  return `${SESSION_COOKIE_NAME}=${testApp.app.get(TokenService).issue(userId)}`;
}

export function setCookieHeaders(response: Response): string[] {
  const header = response.headers['set-cookie'] as string | string[] | undefined;
  if (!header) {
    return [];
  }
  return Array.isArray(header) ? header : [header];
}

/** The session cookie as sent back by the browser: `session=<token>`. */
export function sessionCookieFrom(response: Response): string {
  const cookie = setCookieHeaders(response).find((value) =>
    value.startsWith(`${SESSION_COOKIE_NAME}=`),
  );
  if (!cookie) {
    throw new Error('The response did not set the session cookie');
  }
  return cookie.split(';')[0] ?? '';
}

/** Asserts the single error envelope and returns its body (CT2, BR6.1). */
export function expectErrorEnvelope(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(Object.keys(response.body as object)).toEqual(['error']);
  const error = (response.body as { error: Record<string, unknown> }).error;
  expect(error.code).toBe(code);
  expect(typeof error.message).toBe('string');
  expect(error.traceId).toEqual(response.headers['x-trace-id']);
  return error;
}
