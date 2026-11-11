import { Logger, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { expectDomainError } from '../../../test/support/expect-domain-error.js';
import { FakeClock } from '../../../test/support/fake-clock.js';
import type { AppConfig } from '../../config/app-config.js';
import type { UsersPublicService } from '../../users/users-public.service.js';
import type { UserSummary } from '../../users/users.types.js';
import { ALL_ROLES } from '../actor.js';
import { Public } from '../decorators/public.decorator.js';
import { Roles } from '../decorators/roles.decorator.js';
import { SESSION_COOKIE_NAME } from '../session-cookie.js';
import { TokenService } from '../token.service.js';
import { AuthGuard, type AuthenticatedRequest } from './auth.guard.js';

const APP_ORIGIN = 'http://localhost:8080';

class ProbeController {
  @Public()
  login(): void {}

  @Roles('ADMIN')
  adminOnly(): void {}

  @Roles(...ALL_ROLES)
  anyAuthenticated(): void {}

  unmarked(): void {}

  @Roles()
  emptyRoles(): void {}
}

@Roles('ADMIN')
class AdminController {
  inherited(): void {}
}

const admin: UserSummary = {
  id: 'a1a1a1a1-0000-4000-8000-000000000001',
  name: 'Coordenação',
  role: 'ADMIN',
  sectorId: null,
  active: true,
};
const agent: UserSummary = {
  id: 'a1a1a1a1-0000-4000-8000-000000000002',
  name: 'Atendente',
  role: 'AGENT',
  sectorId: 'b2b2b2b2-0000-4000-8000-000000000001',
  active: true,
};
const inactiveStudent: UserSummary = {
  id: 'a1a1a1a1-0000-4000-8000-000000000003',
  name: 'Aluno inativo',
  role: 'STUDENT',
  sectorId: null,
  active: false,
};

class InMemoryUsersPublic {
  lookups = 0;
  failWith?: Error;
  private readonly summaries = new Map([admin, agent, inactiveStudent].map((u) => [u.id, u]));

  async findSummariesByIds(ids: readonly string[]): Promise<UserSummary[]> {
    this.lookups += 1;
    if (this.failWith) {
      throw this.failWith;
    }
    return ids.flatMap((id) => this.summaries.get(id) ?? []);
  }
}

describe('AuthGuard (WF2, BR1.7, BR1.8, BR2.1 to BR2.3, BR2.6)', () => {
  let tokens: TokenService;
  let users: InMemoryUsersPublic;
  let guard: AuthGuard;

  function requestFor(
    options: { method?: string; origin?: string; userId?: string; token?: string } = {},
  ): AuthenticatedRequest {
    const token = options.token ?? (options.userId ? tokens.issue(options.userId) : undefined);
    return {
      method: options.method ?? 'GET',
      headers: options.origin ? { origin: options.origin } : {},
      cookies: token ? { [SESSION_COOKIE_NAME]: token } : {},
    } as unknown as AuthenticatedRequest;
  }

  function contextFor(
    handler: (...args: never[]) => unknown,
    request: AuthenticatedRequest,
    controller: object = ProbeController,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => handler,
      getClass: () => controller,
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    const clock = new FakeClock();
    tokens = new TokenService(
      new JwtService({ secret: 'unit-test-only-secret-with-enough-length-00000' }),
      clock,
    );
    users = new InMemoryUsersPublic();
    guard = new AuthGuard(
      new Reflector(),
      tokens,
      users as unknown as UsersPublicService,
      {
        appOrigin: APP_ORIGIN,
      } as AppConfig,
    );
  });

  it('lets a public route through without a session', async () => {
    const request = requestFor({ method: 'POST', origin: APP_ORIGIN });

    await expect(
      guard.canActivate(contextFor(ProbeController.prototype.login, request)),
    ).resolves.toBe(true);
    expect(users.lookups).toBe(0);
  });

  it('refuses a state-changing request from another origin, even on a public route', async () => {
    const request = requestFor({ method: 'POST', origin: 'https://evil.example' });

    await expectDomainError(
      guard.canActivate(contextFor(ProbeController.prototype.login, request)),
      'FORBIDDEN',
    );
  });

  it('denies a route without role declaration for everyone, before reading the session', async () => {
    await expectDomainError(
      guard.canActivate(
        contextFor(ProbeController.prototype.unmarked, requestFor({ userId: admin.id })),
      ),
      'FORBIDDEN',
    );
    await expectDomainError(
      guard.canActivate(
        contextFor(ProbeController.prototype.emptyRoles, requestFor({ userId: admin.id })),
      ),
      'FORBIDDEN',
    );
    expect(users.lookups).toBe(0);
  });

  it('answers UNAUTHENTICATED without a session cookie, or when cookies were not parsed', async () => {
    const withoutCookies = { method: 'GET', headers: {} } as unknown as AuthenticatedRequest;

    await expectDomainError(
      guard.canActivate(contextFor(ProbeController.prototype.adminOnly, requestFor())),
      'UNAUTHENTICATED',
    );
    await expectDomainError(
      guard.canActivate(contextFor(ProbeController.prototype.adminOnly, withoutCookies)),
      'UNAUTHENTICATED',
    );
  });

  it('answers UNAUTHENTICATED for an invalid token', async () => {
    await expectDomainError(
      guard.canActivate(
        contextFor(
          ProbeController.prototype.adminOnly,
          requestFor({ token: 'forged.token.value' }),
        ),
      ),
      'UNAUTHENTICATED',
    );
  });

  it('answers UNAUTHENTICATED when the session user is inactive or no longer exists (BR1.8)', async () => {
    await expectDomainError(
      guard.canActivate(
        contextFor(
          ProbeController.prototype.anyAuthenticated,
          requestFor({ userId: inactiveStudent.id }),
        ),
      ),
      'UNAUTHENTICATED',
    );
    await expectDomainError(
      guard.canActivate(
        contextFor(
          ProbeController.prototype.anyAuthenticated,
          requestFor({ userId: 'a1a1a1a1-0000-4000-8000-00000000dead' }),
        ),
      ),
      'UNAUTHENTICATED',
    );
  });

  it('answers FORBIDDEN when the role read from the database is not allowed (BR2.2)', async () => {
    const request = requestFor({ userId: agent.id });

    await expectDomainError(
      guard.canActivate(contextFor(ProbeController.prototype.adminOnly, request)),
      'FORBIDDEN',
    );
    expect(request.actor).toBeUndefined();
  });

  it('attaches only id, role and sector of an allowed actor (BR8.1)', async () => {
    const request = requestFor({ method: 'PATCH', origin: APP_ORIGIN, userId: agent.id });

    await expect(
      guard.canActivate(contextFor(ProbeController.prototype.anyAuthenticated, request)),
    ).resolves.toBe(true);

    expect(request.actor).toEqual({ id: agent.id, role: 'AGENT', sectorId: agent.sectorId });
  });

  it('honours roles declared on the controller class', async () => {
    const request = requestFor({ userId: admin.id });

    await expect(
      guard.canActivate(contextFor(AdminController.prototype.inherited, request, AdminController)),
    ).resolves.toBe(true);
    await expectDomainError(
      guard.canActivate(
        contextFor(
          AdminController.prototype.inherited,
          requestFor({ userId: agent.id }),
          AdminController,
        ),
      ),
      'FORBIDDEN',
    );
  });

  it('fails closed when the actor cannot be resolved (BR2.3)', async () => {
    const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    users.failWith = new Error('database unavailable');
    const request = requestFor({ userId: admin.id });

    await expectDomainError(
      guard.canActivate(contextFor(ProbeController.prototype.adminOnly, request)),
      'INTERNAL_ERROR',
    );
    expect(request.actor).toBeUndefined();
    expect(logError).toHaveBeenCalledTimes(1);
    logError.mockRestore();
  });

  it('logs non-Error failures while resolving the actor and still denies', async () => {
    const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    users.failWith = 'unexpected' as unknown as Error;

    await expectDomainError(
      guard.canActivate(
        contextFor(ProbeController.prototype.adminOnly, requestFor({ userId: admin.id })),
      ),
      'INTERNAL_ERROR',
    );
    expect(logError).toHaveBeenCalledWith('Actor resolution failed; request denied', 'unexpected');
    logError.mockRestore();
  });
});
