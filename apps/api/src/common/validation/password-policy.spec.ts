import { describe, expect, it } from '@jest/globals';
import { validate } from 'class-validator';
import { IsPasswordPolicy } from './is-password-policy.decorator.js';
import {
  checkPasswordPolicy,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  satisfiesPasswordPolicy,
} from './password-policy.js';

describe('checkPasswordPolicy (BR3.4)', () => {
  it('accepts 8 to 128 characters with at least one letter and one digit', () => {
    expect(checkPasswordPolicy('Senha123')).toEqual([]);
    expect(checkPasswordPolicy(`a1${'x'.repeat(PASSWORD_MAX_LENGTH - 2)}`)).toEqual([]);
    expect(satisfiesPasswordPolicy('ação2026')).toBe(true);
  });

  it('refuses fewer than 8 characters', () => {
    expect(checkPasswordPolicy('Abc1234')).toEqual(['PASSWORD_TOO_SHORT']);
    expect('Abc1234'.length).toBe(PASSWORD_MIN_LENGTH - 1);
  });

  it('refuses more than 128 characters', () => {
    expect(checkPasswordPolicy(`a1${'x'.repeat(PASSWORD_MAX_LENGTH - 1)}`)).toEqual([
      'PASSWORD_TOO_LONG',
    ]);
  });

  it('refuses a password without letters or without digits', () => {
    expect(checkPasswordPolicy('12345678')).toEqual(['PASSWORD_MISSING_LETTER']);
    expect(checkPasswordPolicy('abcdefgh')).toEqual(['PASSWORD_MISSING_DIGIT']);
  });

  it('reports every violated rule at once', () => {
    expect(checkPasswordPolicy('')).toEqual([
      'PASSWORD_TOO_SHORT',
      'PASSWORD_MISSING_LETTER',
      'PASSWORD_MISSING_DIGIT',
    ]);
    expect(satisfiesPasswordPolicy('curta')).toBe(false);
  });
});

class PasswordInput {
  @IsPasswordPolicy()
  password: unknown;

  constructor(password: unknown) {
    this.password = password;
  }
}

describe('IsPasswordPolicy decorator', () => {
  it('passes a valid password', async () => {
    expect(await validate(new PasswordInput('Senha123'))).toEqual([]);
  });

  it('reports the first violated rule as the constraint message', async () => {
    const [error] = await validate(new PasswordInput('abc'));

    expect(error?.constraints).toEqual({ passwordPolicy: 'PASSWORD_TOO_SHORT' });
  });

  it('reports INVALID_STRING for a value that is not text', async () => {
    const [error] = await validate(new PasswordInput(12345678));

    expect(error?.constraints).toEqual({ passwordPolicy: 'INVALID_STRING' });
  });
});
