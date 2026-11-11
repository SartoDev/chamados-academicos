import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

export const IS_PUBLIC_KEY = 'auth:isPublic';

/**
 * Marks a route as public. Only login and logout may use it (BR1.9, BR2.4); every other
 * route is denied unless it declares its roles with @Roles.
 */
export function Public(): MethodDecorator & ClassDecorator {
  return applyDecorators(SetMetadata(IS_PUBLIC_KEY, true), ApiExtension('x-roles', ['PUBLIC']));
}
