import { isEmailLike, normalizeEmail } from '../common/email.js';
import { satisfiesPasswordPolicy } from '../common/validation/password-policy.js';

export const APP_CONFIG = Symbol('APP_CONFIG');

export const JWT_SECRET_MIN_LENGTH = 32;
const DEFAULT_PORT = 3000;

export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  appOrigin: string;
  cookieSecure: boolean;
  initialAdmin: {
    email: string;
    password: string;
  };
}

/**
 * BR5.3: startup fails naming the offending variable. The message never contains the value,
 * so secrets do not end up in logs.
 */
export class ConfigValidationError extends Error {
  constructor(
    readonly variable: string,
    reason: string,
  ) {
    super(`Invalid configuration: ${variable} ${reason}.`);
    this.name = 'ConfigValidationError';
  }
}

export type Environment = Record<string, string | undefined>;

function readRequired(env: Environment, name: string, trim = true): string {
  const raw = env[name];
  const value = trim ? raw?.trim() : raw;
  if (!value) {
    throw new ConfigValidationError(name, 'is required but was not set');
  }
  return value;
}

function readPort(env: Environment): number {
  const raw = env.PORT?.trim();
  if (!raw) {
    return DEFAULT_PORT;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigValidationError('PORT', 'must be an integer between 1 and 65535');
  }
  return port;
}

function readBoolean(env: Environment, name: string, fallback: boolean): boolean {
  const raw = env[name]?.trim().toLowerCase();
  if (!raw) {
    return fallback;
  }
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  throw new ConfigValidationError(name, 'must be true or false');
}

function readDatabaseUrl(env: Environment): string {
  const value = readRequired(env, 'DATABASE_URL');
  if (!/^postgres(ql)?:\/\//.test(value)) {
    throw new ConfigValidationError('DATABASE_URL', 'must be a PostgreSQL connection URL');
  }
  return value;
}

function readJwtSecret(env: Environment): string {
  const value = readRequired(env, 'JWT_SECRET');
  if (value.length < JWT_SECRET_MIN_LENGTH) {
    throw new ConfigValidationError(
      'JWT_SECRET',
      `must have at least ${JWT_SECRET_MIN_LENGTH} characters`,
    );
  }
  return value;
}

function readOrigin(env: Environment): string {
  const value = readRequired(env, 'APP_ORIGIN');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ConfigValidationError(
      'APP_ORIGIN',
      'must be an origin such as http://localhost:8080',
    );
  }
  const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
  if (!isHttp || url.origin !== value.replace(/\/$/, '')) {
    throw new ConfigValidationError(
      'APP_ORIGIN',
      'must be an origin such as http://localhost:8080',
    );
  }
  return url.origin;
}

function readInitialAdmin(env: Environment): AppConfig['initialAdmin'] {
  const email = normalizeEmail(readRequired(env, 'INITIAL_ADMIN_EMAIL'));
  if (!isEmailLike(email)) {
    throw new ConfigValidationError('INITIAL_ADMIN_EMAIL', 'must be a valid e-mail address');
  }
  const password = readRequired(env, 'INITIAL_ADMIN_PASSWORD', false);
  if (!satisfiesPasswordPolicy(password)) {
    throw new ConfigValidationError(
      'INITIAL_ADMIN_PASSWORD',
      'does not satisfy the password policy (8 to 128 characters, at least one letter and one digit)',
    );
  }
  return { email, password };
}

/** Reads and validates every required setting (BR5.3). Pure: receives the environment. */
export function loadConfig(env: Environment): AppConfig {
  return {
    databaseUrl: readDatabaseUrl(env),
    jwtSecret: readJwtSecret(env),
    appOrigin: readOrigin(env),
    initialAdmin: readInitialAdmin(env),
    cookieSecure: readBoolean(env, 'COOKIE_SECURE', false),
    port: readPort(env),
  };
}
