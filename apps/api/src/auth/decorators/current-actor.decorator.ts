import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { DomainError } from '../../common/errors/domain-error.js';
import type { Actor } from '../actor.js';
import type { AuthenticatedRequest } from '../guards/auth.guard.js';

export function resolveCurrentActor(request: AuthenticatedRequest): Actor {
  if (!request.actor) {
    // Only reachable if a public route asks for the actor: a programming error, never data.
    throw new DomainError('INTERNAL_ERROR', 'The actor was requested on a route without one');
  }
  return request.actor;
}

/** Injects the actor resolved by the global guard into a controller method. */
export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor =>
    resolveCurrentActor(context.switchToHttp().getRequest<AuthenticatedRequest>()),
);
