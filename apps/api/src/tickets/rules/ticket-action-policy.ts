import { requiresSector, type Role } from '../../common/roles.js';
import type { TicketStatusKey } from './ticket-transitions.js';

/**
 * Who may act on a ticket (BR1.1, BR2.3, BR2.9, BR3.1 to BR3.8, BR4.3). Pure module: it decides
 * from the actor, the facts of the ticket and, where the rule needs it, one boolean the service
 * resolved beforehand. Visibility answered 404 before any of this runs (BR2.4), and the status
 * transition itself is decided by the transition machine.
 */
export interface PolicyActor {
  id: string;
  role: Role;
  sectorId: string | null;
}

export interface PolicyTicket {
  requesterId: string;
  assigneeId: string | null;
  sectorId: string;
  statusKey: TicketStatusKey;
}

export type TicketActionKind =
  | 'ASSUME'
  | 'ASSIGN'
  | 'TRANSFER'
  | 'WAIT_FOR_REQUESTER'
  | 'CLOSE'
  | 'REOPEN'
  | 'CHANGE_PRIORITY'
  | 'LIST_ASSIGNABLE';

export type TicketRefusal =
  | 'FORBIDDEN'
  | 'TICKET_CLOSED'
  | 'TICKET_ALREADY_ASSIGNED'
  | 'TICKET_ASSIGNEE_NOT_IN_SECTOR'
  | 'TICKET_TRANSFER_SAME_SECTOR';

export const REQUESTER_ROLES: readonly Role[] = ['STUDENT', 'PROFESSOR'];

/** BR1.1: only a student or a professor opens a ticket. */
export function canOpenTicket(role: Role): boolean {
  return REQUESTER_ROLES.includes(role);
}

export function isRequesterRole(role: Role): boolean {
  return REQUESTER_ROLES.includes(role);
}

/** AGENT and MANAGER, the roles that always belong to one sector (BR3.3 of U1). */
export function isSectorRole(role: Role): boolean {
  return requiresSector(role);
}

export function worksInCurrentSector(actor: PolicyActor, ticket: PolicyTicket): boolean {
  return isSectorRole(actor.role) && actor.sectorId !== null && actor.sectorId === ticket.sectorId;
}

/**
 * BR2.3, BR3.8: the administrator, and whoever sees the ticket only because it once passed
 * through their sector, read it and never act on it.
 */
export function isReadOnlyViewer(actor: PolicyActor, ticket: PolicyTicket): boolean {
  if (actor.role === 'ADMIN') {
    return true;
  }
  return isSectorRole(actor.role) && !worksInCurrentSector(actor, ticket);
}

function isAssigneeOrManager(actor: PolicyActor, ticket: PolicyTicket): boolean {
  return ticket.assigneeId === actor.id || actor.role === 'MANAGER';
}

/** Shared beginning of the actions of the attending roles: closed first, then the sector. */
function sectorActionRefusal(actor: PolicyActor, ticket: PolicyTicket): TicketRefusal | null {
  if (ticket.statusKey === 'CLOSED') {
    return 'TICKET_CLOSED';
  }
  return worksInCurrentSector(actor, ticket) ? null : 'FORBIDDEN';
}

/**
 * The refusal an action deserves before its catalog lookups and its transition, or null when
 * the actor may go on. A closed ticket refuses the attending actions with TICKET_CLOSED
 * (BR3.1, BR3.2, BR3.3, BR3.7), while closing and waiting for the requester are refused by the
 * transition machine instead (BR3.4, BR3.5).
 */
export function ticketActionRefusal(
  action: TicketActionKind,
  actor: PolicyActor,
  ticket: PolicyTicket,
): TicketRefusal | null {
  switch (action) {
    case 'ASSUME':
    case 'TRANSFER':
    case 'CHANGE_PRIORITY':
      return isSectorRole(actor.role) ? sectorActionRefusal(actor, ticket) : 'FORBIDDEN';
    case 'ASSIGN':
      return actor.role === 'MANAGER' ? sectorActionRefusal(actor, ticket) : 'FORBIDDEN';
    case 'WAIT_FOR_REQUESTER':
      if (!isSectorRole(actor.role) || !worksInCurrentSector(actor, ticket)) {
        return 'FORBIDDEN';
      }
      return isAssigneeOrManager(actor, ticket) ? null : 'FORBIDDEN';
    case 'CLOSE':
      if (isRequesterRole(actor.role)) {
        return ticket.requesterId === actor.id ? null : 'FORBIDDEN';
      }
      if (!isSectorRole(actor.role) || !worksInCurrentSector(actor, ticket)) {
        return 'FORBIDDEN';
      }
      return isAssigneeOrManager(actor, ticket) ? null : 'FORBIDDEN';
    case 'REOPEN':
      if (!isRequesterRole(actor.role)) {
        return 'FORBIDDEN';
      }
      return ticket.requesterId === actor.id ? null : 'FORBIDDEN';
    case 'LIST_ASSIGNABLE':
      if (actor.role !== 'MANAGER') {
        return 'FORBIDDEN';
      }
      return worksInCurrentSector(actor, ticket) ? null : 'FORBIDDEN';
  }
}

/**
 * BR3.1, BR7.2: a ticket with an available assignee other than the actor is not taken over.
 * An unavailable assignee does not block the sector (BR3.9, Q6).
 */
export function assumeConflictRefusal(
  actor: PolicyActor,
  ticket: PolicyTicket,
  assigneeAvailable: boolean,
): 'TICKET_ALREADY_ASSIGNED' | null {
  if (!ticket.assigneeId || ticket.assigneeId === actor.id) {
    return null;
  }
  return assigneeAvailable ? 'TICKET_ALREADY_ASSIGNED' : null;
}

/** BR3.2: the chosen person must be able to receive tickets of the current sector. */
export function assignTargetRefusal(
  targetAssignable: boolean,
): 'TICKET_ASSIGNEE_NOT_IN_SECTOR' | null {
  return targetAssignable ? null : 'TICKET_ASSIGNEE_NOT_IN_SECTOR';
}

/** BR3.3: the destination of a transfer is another sector, never the current one. */
export function transferTargetRefusal(
  ticket: PolicyTicket,
  targetSectorId: string,
): 'TICKET_TRANSFER_SAME_SECTOR' | null {
  return targetSectorId === ticket.sectorId ? 'TICKET_TRANSFER_SAME_SECTOR' : null;
}
