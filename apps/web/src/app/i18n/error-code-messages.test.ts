import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from '../api/api-client';
import { ERROR_CODE_MESSAGES, messageForError, messageForFieldCode } from './error-code-messages';

const U1_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INTERNAL_ERROR',
  'AUTH_INVALID_CREDENTIALS',
  'AUTH_TOO_MANY_ATTEMPTS',
  'USER_NOT_FOUND',
  'USER_EMAIL_TAKEN',
  'USER_SECTOR_REQUIRED',
  'USER_SELF_MODIFICATION_FORBIDDEN',
  'USER_LAST_ACTIVE_ADMIN',
  'CATALOG_ITEM_NOT_FOUND',
  'CATALOG_ITEM_INACTIVE',
  'CATALOG_NAME_TAKEN',
  'CATALOG_DEFAULT_PRIORITY_REQUIRED',
];

const apiError = (code: string, details?: unknown, traceId?: string) =>
  new ApiError(400, code, details, traceId);

describe('error code messages (BR7.5, CT11)', () => {
  it('translates every error code of U1', () => {
    for (const code of U1_CODES) {
      expect(ERROR_CODE_MESSAGES[code], code).toBeTruthy();
      expect(messageForError(apiError(code))).toBe(ERROR_CODE_MESSAGES[code]);
    }
  });

  it('gives the single message for refused credentials (BR1.2)', () => {
    expect(messageForError(apiError('AUTH_INVALID_CREDENTIALS'))).toBe(
      'E-mail ou senha incorretos.',
    );
  });

  it('tells how long to wait after too many attempts (BR1.4)', () => {
    expect(messageForError(apiError('AUTH_TOO_MANY_ATTEMPTS', { retryAfterSeconds: 45 }))).toBe(
      'Muitas tentativas de entrada. Tente novamente em 1 minuto.',
    );
    expect(messageForError(apiError('AUTH_TOO_MANY_ATTEMPTS', { retryAfterSeconds: 900 }))).toBe(
      'Muitas tentativas de entrada. Tente novamente em 15 minutos.',
    );
    expect(messageForError(apiError('AUTH_TOO_MANY_ATTEMPTS'))).toBe(
      ERROR_CODE_MESSAGES.AUTH_TOO_MANY_ATTEMPTS,
    );
  });

  it('shows a generic message with the trace id for an unknown code', () => {
    expect(messageForError(apiError('TICKET_SOMETHING_NEW', undefined, 'abc-123'))).toBe(
      'Ocorreu um erro inesperado. Código de rastreio: abc-123.',
    );
    expect(messageForError(apiError('TICKET_SOMETHING_NEW'))).toBe('Ocorreu um erro inesperado.');
  });

  it('explains network failures and unexpected values', () => {
    expect(messageForError(new NetworkError('offline'))).toMatch(/conectar ao servidor/);
    expect(messageForError(new NetworkError('timeout'))).toMatch(/demorou para responder/);
    expect(messageForError(new Error('bug'))).toBe('Ocorreu um erro inesperado.');
  });

  it('translates field codes, with a fallback', () => {
    expect(messageForFieldCode('PASSWORD_MISSING_DIGIT')).toBe(
      'A senha deve ter ao menos um algarismo.',
    );
    expect(messageForFieldCode('SOMETHING_ELSE')).toBe('Valor inválido.');
  });
});
