import type { Role } from '../common/roles.js';
import type { CurrentUserView, UserView } from './users.types.js';

/** Shape of a user row read with its sector; kept structural so no Prisma type leaks out. */
export interface UserRowWithSector {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  sector: { id: string; name: string } | null;
}

export const USER_WITH_SECTOR = { sector: { select: { id: true, name: true } } } as const;

export function toUserView(user: UserRowWithSector): UserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    sector: user.sector ? { id: user.sector.id, name: user.sector.name } : null,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toCurrentUserView(user: UserRowWithSector): CurrentUserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    sector: user.sector ? { id: user.sector.id, name: user.sector.name } : null,
  };
}
