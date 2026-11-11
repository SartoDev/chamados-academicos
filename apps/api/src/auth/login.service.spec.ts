import { JwtService } from '@nestjs/jwt';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { expectDomainError } from '../../test/support/expect-domain-error.js';
import { FakeClock } from '../../test/support/fake-clock.js';
import { AppEvents } from '../common/events/app-events.js';
import { Argon2PasswordHasher } from '../common/security/password-hasher.js';
import type { UsersService } from '../users/users.service.js';
import type { CurrentUserView, UserCredentials } from '../users/users.types.js';
import {
  ATTEMPT_WINDOW_MS,
  LoginAttemptLimiter,
  MAX_FAILED_ATTEMPTS,
} from './login-attempt-limiter.js';
import { LoginService } from './login.service.js';
import { TokenService } from './token.service.js';

const SECRET = 'unit-test-only-secret-with-enough-length-00000';
const PASSWORD = 'Senha12345';

/** Stand-in for the two read methods LoginService uses; no Prisma involved. */
class InMemoryUsers {
  readonly credentials = new Map<string, UserCredentials>();
  readonly currentUsers = new Map<string, CurrentUserView>();

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return this.credentials.get(email) ?? null;
  }

  async getCurrentUser(userId: string): Promise<CurrentUserView> {
    const user = this.currentUsers.get(userId);
    if (!user) {
      throw new Error(`Unknown user ${userId}`);
    }
    return user;
  }
}

describe('LoginService (WF1, BR1.1 to BR1.5)', () => {
  const hasher = new Argon2PasswordHasher();
  let passwordHash: string;
  let users: InMemoryUsers;
  let limiter: LoginAttemptLimiter;
  let tokens: TokenService;
  let service: LoginService;

  const activeStudent: CurrentUserView = {
    id: '6f0b9a52-8f4c-4a7e-9f6f-2d7b1a0c0001',
    name: 'Ana Souza',
    email: 'ana.souza@example.test',
    role: 'STUDENT',
    sector: null,
  };
  const inactiveProfessorEmail = 'carlos.melo@example.test';

  beforeAll(async () => {
    passwordHash = await hasher.hash(PASSWORD);
  });

  beforeEach(() => {
    const clock = new FakeClock();
    users = new InMemoryUsers();
    users.credentials.set(activeStudent.email, {
      id: activeStudent.id,
      passwordHash,
      active: true,
    });
    users.currentUsers.set(activeStudent.id, activeStudent);
    users.credentials.set(inactiveProfessorEmail, {
      id: '6f0b9a52-8f4c-4a7e-9f6f-2d7b1a0c0002',
      passwordHash,
      active: false,
    });
    limiter = new LoginAttemptLimiter(clock, new AppEvents());
    tokens = new TokenService(new JwtService({ secret: SECRET }), clock);
    service = new LoginService(users as unknown as UsersService, hasher, limiter, tokens);
  });

  it('starts a session for an active user with the right password, normalizing the e-mail', async () => {
    const result = await service.login('  Ana.Souza@Example.TEST ', PASSWORD);

    expect(result.user).toEqual(activeStudent);
    expect(tokens.verify(result.token)).toBe(activeStudent.id);
  });

  it('answers the same code and message for unknown e-mail, wrong password and inactive user', async () => {
    const unknown = await expectDomainError(
      service.login('ninguem@example.test', PASSWORD),
      'AUTH_INVALID_CREDENTIALS',
    );
    const wrongPassword = await expectDomainError(
      service.login(activeStudent.email, 'Errada123'),
      'AUTH_INVALID_CREDENTIALS',
    );
    const inactive = await expectDomainError(
      service.login(inactiveProfessorEmail, PASSWORD),
      'AUTH_INVALID_CREDENTIALS',
    );

    const shape = (error: typeof unknown) => ({
      status: error.status,
      message: error.message,
      details: error.details,
      headers: error.headers,
    });
    expect(shape(wrongPassword)).toEqual(shape(unknown));
    expect(shape(inactive)).toEqual(shape(unknown));
    expect(unknown.status).toBe(401);
  });

  it('verifies a reference hash when the e-mail does not exist (BR1.3)', async () => {
    await service.onModuleInit();
    const verify = jest.spyOn(hasher, 'verify');

    await expectDomainError(
      service.login('ninguem@example.test', PASSWORD),
      'AUTH_INVALID_CREDENTIALS',
    );

    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify.mock.calls[0]?.[0]).toMatch(/^\$argon2id\$/);
    verify.mockRestore();
  });

  it('blocks the sixth attempt after five failures without checking the password (BR1.4)', async () => {
    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      await expectDomainError(
        service.login(activeStudent.email, 'Errada123'),
        'AUTH_INVALID_CREDENTIALS',
      );
    }
    const verify = jest.spyOn(hasher, 'verify');

    const blocked = await expectDomainError(
      service.login(activeStudent.email, PASSWORD),
      'AUTH_TOO_MANY_ATTEMPTS',
    );

    expect(blocked.status).toBe(429);
    expect(blocked.details).toEqual({ retryAfterSeconds: ATTEMPT_WINDOW_MS / 1000 });
    expect(blocked.headers).toEqual({ 'Retry-After': String(ATTEMPT_WINDOW_MS / 1000) });
    expect(verify).not.toHaveBeenCalled();
    verify.mockRestore();
  });

  it('counts failures for e-mails that do not exist exactly like existing ones', async () => {
    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      await expectDomainError(
        service.login('ninguem@example.test', 'x1'),
        'AUTH_INVALID_CREDENTIALS',
      );
    }

    await expectDomainError(service.login('ninguem@example.test', 'x1'), 'AUTH_TOO_MANY_ATTEMPTS');
  });

  it('clears the failure count after a successful login', async () => {
    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS - 1; attempt += 1) {
      await expectDomainError(
        service.login(activeStudent.email, 'Errada123'),
        'AUTH_INVALID_CREDENTIALS',
      );
    }

    await service.login(activeStudent.email, PASSWORD);
    await expectDomainError(
      service.login(activeStudent.email, 'Errada123'),
      'AUTH_INVALID_CREDENTIALS',
    );

    expect(limiter.blockedForSeconds(activeStudent.email)).toBe(0);
  });

  it('computes the reference hash only once', async () => {
    const hash = jest.spyOn(hasher, 'hash');

    await service.onModuleInit();
    await expectDomainError(
      service.login('ninguem@example.test', PASSWORD),
      'AUTH_INVALID_CREDENTIALS',
    );

    expect(hash).toHaveBeenCalledTimes(1);
    hash.mockRestore();
  });
});
