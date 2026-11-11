import { ROLES, type Role } from '../common/roles.js';

export type { Role } from '../common/roles.js';

/** Every role: used by routes open to any authenticated user, always declared explicitly. */
export const ALL_ROLES: readonly Role[] = ROLES;

/**
 * SVC-01, SVC-02, SVC-04, SVC-06: the authenticated actor handed to every unit. Identifier,
 * role and sector are read from the database on the current request; never name, e-mail or
 * password hash (BR8.1).
 */
export interface Actor {
  id: string;
  role: Role;
  sectorId: string | null;
}
