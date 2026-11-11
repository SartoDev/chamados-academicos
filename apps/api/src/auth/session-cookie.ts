import type { CookieOptions } from 'express';

/** BR1.5: a session lasts 8 hours from issuance, with no refresh token. */
export const SESSION_DURATION_SECONDS = 8 * 60 * 60;

export const SESSION_COOKIE_NAME = 'session';
export const SESSION_COOKIE_PATH = '/api';

const BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  path: SESSION_COOKIE_PATH,
} as const satisfies CookieOptions;

/** httpOnly, SameSite=Strict, Path=/api, 8 hours; Secure when served over HTTPS (BR1.5). */
export function sessionCookieOptions(secure: boolean): CookieOptions {
  return { ...BASE_OPTIONS, secure, maxAge: SESSION_DURATION_SECONDS * 1000 };
}

/** The same attributes are required for the browser to delete the cookie (BR1.6). */
export function clearedSessionCookieOptions(secure: boolean): CookieOptions {
  return { ...BASE_OPTIONS, secure };
}
