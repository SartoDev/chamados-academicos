import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';
import type { Role } from '../actor.js';

export const ROLES_KEY = 'auth:roles';

/**
 * Declares the roles allowed to call a route (BR2.1, BR2.2, BR2.7) and publishes them as the
 * `x-roles` extension of the generated OpenAPI document.
 */
export function Roles(...roles: readonly Role[]): MethodDecorator & ClassDecorator {
  return applyDecorators(SetMetadata(ROLES_KEY, roles), ApiExtension('x-roles', [...roles]));
}
