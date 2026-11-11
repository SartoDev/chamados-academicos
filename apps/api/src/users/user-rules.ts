import { requiresSector, type Role } from '../common/roles.js';

export type SectorResolution =
  | { kind: 'none' }
  | { kind: 'missing' }
  | { kind: 'keep'; sectorId: string }
  | { kind: 'assign'; sectorId: string };

/**
 * BR3.3 on the resulting state: agents and managers need a sector, every other role has none
 * even if one was sent. `requestedSectorId` undefined keeps the current sector. Only a newly
 * assigned sector must be checked for existence and active state (BR4.5).
 */
export function resolveSector(
  role: Role,
  requestedSectorId: string | null | undefined,
  currentSectorId: string | null,
): SectorResolution {
  if (!requiresSector(role)) {
    return { kind: 'none' };
  }
  const sectorId = requestedSectorId === undefined ? currentSectorId : requestedSectorId;
  if (!sectorId) {
    return { kind: 'missing' };
  }
  return sectorId === currentSectorId ? { kind: 'keep', sectorId } : { kind: 'assign', sectorId };
}

export interface AdminState {
  role: Role;
  active: boolean;
}

export function isActiveAdmin(state: AdminState): boolean {
  return state.role === 'ADMIN' && state.active;
}

/** True when a change deactivates an active admin or removes the ADMIN role from one. */
export function losesActiveAdmin(current: AdminState, next: AdminState): boolean {
  return isActiveAdmin(current) && !isActiveAdmin(next);
}

export type AdminProtectionViolation =
  'USER_SELF_MODIFICATION_FORBIDDEN' | 'USER_LAST_ACTIVE_ADMIN';

export interface AdminProtectionInput {
  actorId: string;
  targetId: string;
  current: AdminState;
  next: AdminState;
  /** Active admins counted inside the same serialized transaction. */
  activeAdminCount: number;
}

/** BR3.9: the system never ends up without an active administrator. */
export function adminProtectionViolation(
  input: AdminProtectionInput,
): AdminProtectionViolation | null {
  if (!losesActiveAdmin(input.current, input.next)) {
    return null;
  }
  if (input.actorId === input.targetId) {
    return 'USER_SELF_MODIFICATION_FORBIDDEN';
  }
  if (input.activeAdminCount <= 1) {
    return 'USER_LAST_ACTIVE_ADMIN';
  }
  return null;
}

export interface AssignableCandidate {
  active: boolean;
  role: Role;
  sectorId: string | null;
}

/**
 * BR8.3: active AGENT or MANAGER of exactly that sector. The sector's own state is ignored,
 * so tickets already in a deactivated sector can still be assigned.
 */
export function isAssignable(candidate: AssignableCandidate | null, sectorId: string): boolean {
  return (
    candidate !== null &&
    candidate.active &&
    requiresSector(candidate.role) &&
    candidate.sectorId === sectorId
  );
}
