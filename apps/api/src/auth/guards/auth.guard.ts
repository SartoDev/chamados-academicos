import {
  Inject,
  Injectable,
  Logger,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { DomainError } from '../../common/errors/domain-error.js';
import { APP_CONFIG, type AppConfig } from '../../config/app-config.js';
import { UsersPublicService } from '../../users/users-public.service.js';
import type { Actor, Role } from '../actor.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { SESSION_COOKIE_NAME } from '../session-cookie.js';
import { TokenService } from '../token.service.js';
import { isCrossOriginStateChange } from './origin-check.js';

export interface AuthenticatedRequest extends Request {
  actor?: Actor;
}

/**
 * Global deny-by-default guard (WF2). Order: origin check, public marker, role declaration,
 * token, actor read from the database, role membership. Any failure while resolving the
 * actor denies the request (fail closed, BR2.3).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly users: UsersPublicService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (isCrossOriginStateChange(request.method, request.headers.origin, this.config.appOrigin)) {
      throw new DomainError('FORBIDDEN', 'State-changing request from another origin');
    }

    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const allowedRoles = this.reflector.getAllAndOverride<readonly Role[] | undefined>(
      ROLES_KEY,
      targets,
    );
    if (!allowedRoles || allowedRoles.length === 0) {
      throw new DomainError('FORBIDDEN', 'Route without a role declaration is denied');
    }

    const cookies = request.cookies as Record<string, string | undefined> | undefined;
    const userId = this.tokens.verify(cookies?.[SESSION_COOKIE_NAME]);
    if (!userId) {
      throw new DomainError('UNAUTHENTICATED', 'Missing, invalid or expired session');
    }

    const actor = await this.resolveActor(userId);
    if (!actor) {
      throw new DomainError('UNAUTHENTICATED', 'Session user does not exist or is inactive');
    }
    // BR2.2: denied before any read of the requested resource.
    if (!allowedRoles.includes(actor.role)) {
      throw new DomainError('FORBIDDEN', 'Role not allowed for this route');
    }

    request.actor = actor;
    return true;
  }

  /** BR1.8: role, sector and active state come from the database on every request. */
  private async resolveActor(userId: string): Promise<Actor | null> {
    let summaries;
    try {
      summaries = await this.users.findSummariesByIds([userId]);
    } catch (error) {
      this.logger.error(
        'Actor resolution failed; request denied',
        error instanceof Error ? error.stack : String(error),
      );
      throw new DomainError('INTERNAL_ERROR', 'Actor could not be resolved');
    }
    const user = summaries[0];
    if (!user || !user.active) {
      return null;
    }
    return { id: user.id, role: user.role, sectorId: user.sectorId };
  }
}
