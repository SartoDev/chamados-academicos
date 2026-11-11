import type { Role } from '../common/roles.js';

export interface SectorRefView {
  id: string;
  name: string;
}

/** API-U1 `User`. The password and its hash never appear (BR3.5). */
export interface UserView {
  id: string;
  name: string;
  email: string;
  role: Role;
  sector: SectorRefView | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** API-U1 `CurrentUser`: the session owner only (BR2.5). */
export interface CurrentUserView {
  id: string;
  name: string;
  email: string;
  role: Role;
  sector: SectorRefView | null;
}

/** SVC-01/SVC-02 `UserSummary` (BR8.2): no e-mail, no password hash. */
export interface UserSummary {
  id: string;
  name: string;
  role: Role;
  sectorId: string | null;
  active: boolean;
}

/** Internal to U1: what Auth needs to verify a login. */
export interface UserCredentials {
  id: string;
  passwordHash: string;
  active: boolean;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: Role;
  password: string;
  sectorId?: string | null;
}

/** `undefined` keeps the current value; `sectorId: null` asks for no sector. */
export interface UpdateUserInput {
  name?: string;
  role?: Role;
  sectorId?: string | null;
  active?: boolean;
}

export interface ListUsersFilter {
  role?: Role;
  active?: boolean;
  sectorId?: string;
}
