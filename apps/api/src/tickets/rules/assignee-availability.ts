import { requiresSector, type Role } from '../../common/roles.js';

/**
 * Availability of the assignee (BR3.9, Q6), from the user summary of U1 and the sector the
 * ticket is in today. Pure module: the summary arrives from the public service of U1.
 */
export interface AssigneeSummary {
  id: string;
  role: Role;
  sectorId: string | null;
  active: boolean;
}

/** BR8.3 of U1: an active AGENT or MANAGER of exactly that sector may receive its tickets. */
export function isAssignableInSector(user: AssigneeSummary | undefined, sectorId: string): boolean {
  return (
    user !== undefined && user.active && requiresSector(user.role) && user.sectorId === sectorId
  );
}

/**
 * True when the ticket has an assignee who could no longer receive it: deactivated, with
 * another role, or moved to another sector. The ticket keeps the assignee and is shown with
 * the mark; any agent of the sector may take it over as if it had none (BR3.1).
 */
export function isAssigneeUnavailable(
  assigneeId: string | null,
  assignee: AssigneeSummary | undefined,
  sectorId: string,
): boolean {
  if (!assigneeId) {
    return false;
  }
  return !isAssignableInSector(assignee, sectorId);
}
