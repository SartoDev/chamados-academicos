import { Logger } from '@nestjs/common';
import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Argon2PasswordHasher } from './password-hasher.js';

describe('Argon2PasswordHasher (BR3.5)', () => {
  const hasher = new Argon2PasswordHasher();
  const password = 'Senha12345';
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hasher.hash(password);
  });

  it('stores an argon2id hash that never contains the password', () => {
    expect(passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(passwordHash).not.toContain(password);
  });

  it('verifies the right password and rejects a wrong one', async () => {
    expect(await hasher.verify(passwordHash, password)).toBe(true);
    expect(await hasher.verify(passwordHash, 'Senha12346')).toBe(false);
  });

  it('uses a fresh salt for every hash', async () => {
    expect(await hasher.hash(password)).not.toBe(passwordHash);
  });

  it('rejects a malformed stored hash and reports it', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    expect(await hasher.verify('not-a-hash', password)).toBe(false);

    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
