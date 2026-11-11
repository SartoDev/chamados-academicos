import { requiresSector, type Role } from '../../common/roles.js';

/**
 * Who reads and who writes in the conversation of a ticket (BR1.2, BR1.3, BR1.4). Pure module:
 * it decides from the actor and from the facts `getVisibleTicket` answered, never from a query
 * of its own. Visibility of the ticket itself was already decided by U2 (BR1.1), so reaching
 * this module means the actor may see the ticket — not that they may see its conversation.
 */
export interface ConversationActor {
  id: string;
  role: Role;
  sectorId: string | null;
}

/** The subset of `VisibleTicket` (SVC-03) the access and the send rules need. */
export interface ConversationTicket {
  requesterId: string;
  assigneeId: string | null;
  sectorId: string;
  passedSectorIds: readonly string[];
  statusKey: string;
}

/** Codes the conversation refuses with, in the order WF2 applies them. */
export type ConversationRefusal = 'TICKET_NOT_FOUND' | 'FORBIDDEN' | 'MESSAGE_TICKET_CLOSED';

export const CLOSED_STATUS_KEY = 'CLOSED';

/** AGENT and MANAGER, the roles that always belong to one sector (BR3.3 of U1). */
function worksInSector(actor: ConversationActor, sectorId: string): boolean {
  return requiresSector(actor.role) && actor.sectorId !== null && actor.sectorId === sectorId;
}

/**
 * BR1.2, BR1.4: the requester, the current assignee, and agents and managers of the current
 * sector or of a sector the ticket passed through. The administrator is outside the list even
 * though U2 lets them see the ticket, because the conversation may carry personal matters.
 */
export function canReadConversation(actor: ConversationActor, ticket: ConversationTicket): boolean {
  if (actor.role === 'ADMIN') {
    return false;
  }
  if (actor.id === ticket.requesterId || actor.id === ticket.assigneeId) {
    return true;
  }
  if (worksInSector(actor, ticket.sectorId)) {
    return true;
  }
  return ticket.passedSectorIds.some((sectorId) => worksInSector(actor, sectorId));
}

/**
 * BR1.3: the requester, the current assignee and the manager of the current sector. Narrower
 * than the read rule on purpose — an agent of the sector who did not take the ticket, and a
 * reader by sector passage, follow the case without answering in the name of the sector. On a
 * ticket without an assignee only the requester writes; whoever wants to answer takes it first.
 */
export function canWriteConversation(
  actor: ConversationActor,
  ticket: ConversationTicket,
): boolean {
  if (actor.role === 'ADMIN') {
    return false;
  }
  if (actor.id === ticket.requesterId || actor.id === ticket.assigneeId) {
    return true;
  }
  return actor.role === 'MANAGER' && worksInSector(actor, ticket.sectorId);
}

/** BR1.2, BR1.4: whoever may not read answers as if the ticket did not exist. */
export function readRefusal(
  actor: ConversationActor,
  ticket: ConversationTicket,
): ConversationRefusal | null {
  return canReadConversation(actor, ticket) ? null : 'TICKET_NOT_FOUND';
}

/**
 * WF2 steps 2 to 4, in this order: whoever may not read is hidden the ticket, whoever reads but
 * may not write is refused without hiding it, and a closed ticket refuses every author (BR2.2).
 */
export function sendRefusal(
  actor: ConversationActor,
  ticket: ConversationTicket,
): ConversationRefusal | null {
  if (!canReadConversation(actor, ticket)) {
    return 'TICKET_NOT_FOUND';
  }
  if (!canWriteConversation(actor, ticket)) {
    return 'FORBIDDEN';
  }
  return ticket.statusKey === CLOSED_STATUS_KEY ? 'MESSAGE_TICKET_CLOSED' : null;
}
