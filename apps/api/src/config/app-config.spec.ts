import { describe, expect, it } from '@jest/globals';
import {
  ConfigValidationError,
  JWT_SECRET_MIN_LENGTH,
  loadConfig,
  type Environment,
} from './app-config.js';

const VALID_ENV: Environment = {
  DATABASE_URL: 'postgresql://app:fake-password@localhost:5432/app',
  JWT_SECRET: 'unit-test-secret-that-is-long-enough-000',
  APP_ORIGIN: 'http://localhost:8080',
  INITIAL_ADMIN_EMAIL: ' Admin@Example.TEST ',
  INITIAL_ADMIN_PASSWORD: 'Admin12345',
};

function loadWith(overrides: Environment): () => unknown {
  return () => loadConfig({ ...VALID_ENV, ...overrides });
}

function captureError(action: () => unknown): ConfigValidationError {
  try {
    action();
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      return error;
    }
    throw error;
  }
  throw new Error('Expected a ConfigValidationError');
}

describe('loadConfig (BR5.3)', () => {
  it('reads a valid environment with defaults and a normalized admin e-mail', () => {
    const config = loadConfig(VALID_ENV);

    expect(config).toEqual({
      databaseUrl: VALID_ENV.DATABASE_URL,
      jwtSecret: VALID_ENV.JWT_SECRET,
      appOrigin: 'http://localhost:8080',
      cookieSecure: false,
      port: 3000,
      initialAdmin: { email: 'admin@example.test', password: 'Admin12345' },
    });
  });

  it.each([
    'DATABASE_URL',
    'JWT_SECRET',
    'APP_ORIGIN',
    'INITIAL_ADMIN_EMAIL',
    'INITIAL_ADMIN_PASSWORD',
  ])('fails naming %s when it is missing or blank', (variable) => {
    expect(captureError(loadWith({ [variable]: undefined })).variable).toBe(variable);
    expect(captureError(loadWith({ [variable]: '' })).variable).toBe(variable);
  });

  it('rejects a database URL that is not PostgreSQL', () => {
    const error = captureError(loadWith({ DATABASE_URL: 'mysql://user:pass@localhost/db' }));

    expect(error.variable).toBe('DATABASE_URL');
    expect(error.message).not.toContain('pass@localhost');
  });

  it(`rejects a JWT secret shorter than ${JWT_SECRET_MIN_LENGTH} characters without echoing it`, () => {
    const error = captureError(loadWith({ JWT_SECRET: 'short-secret' }));

    expect(error.variable).toBe('JWT_SECRET');
    expect(error.message).not.toContain('short-secret');
  });

  it.each(['localhost:8080', 'ftp://localhost', 'http://localhost:8080/app', 'not a url'])(
    'rejects APP_ORIGIN "%s" that is not a plain http(s) origin',
    (origin) => {
      expect(captureError(loadWith({ APP_ORIGIN: origin })).variable).toBe('APP_ORIGIN');
    },
  );

  it('accepts an origin with a trailing slash and stores it without it', () => {
    expect(
      loadConfig({ ...VALID_ENV, APP_ORIGIN: 'https://chamados.example.test/' }).appOrigin,
    ).toBe('https://chamados.example.test');
  });

  it('rejects an invalid initial admin e-mail', () => {
    expect(captureError(loadWith({ INITIAL_ADMIN_EMAIL: 'admin-at-example' })).variable).toBe(
      'INITIAL_ADMIN_EMAIL',
    );
  });

  it.each(['Short1', 'onlyletters', '12345678', `A1${'x'.repeat(127)}`])(
    'rejects an initial admin password outside the policy without echoing it (%#)',
    (password) => {
      const error = captureError(loadWith({ INITIAL_ADMIN_PASSWORD: password }));

      expect(error.variable).toBe('INITIAL_ADMIN_PASSWORD');
      expect(error.message).not.toContain(password);
    },
  );

  it('parses COOKIE_SECURE and PORT, rejecting invalid values', () => {
    expect(loadConfig({ ...VALID_ENV, COOKIE_SECURE: 'TRUE', PORT: '8081' })).toMatchObject({
      cookieSecure: true,
      port: 8081,
    });
    expect(loadConfig({ ...VALID_ENV, COOKIE_SECURE: 'false' }).cookieSecure).toBe(false);
    expect(captureError(loadWith({ COOKIE_SECURE: 'yes' })).variable).toBe('COOKIE_SECURE');
    expect(captureError(loadWith({ PORT: '70000' })).variable).toBe('PORT');
    expect(captureError(loadWith({ PORT: 'abc' })).variable).toBe('PORT');
  });
});
