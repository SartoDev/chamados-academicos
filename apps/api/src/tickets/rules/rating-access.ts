import { requiresSector, type Role } from '../../common/roles.js';

/**
 * Who rates and who reads the rating of a ticket (BR1.1, BR1.2, BR1.3). Pure module: it decides
 * from the actor and from the facts `getVisibleTicket` answered, never from a query of its own.
 * Visibility of the ticket itself was already decided by U2, so reaching this module means the
 * actor may see the ticket — the rules below only narrow that, never widen it.
 */
export interface RatingActor {
  id: string;
  role: Role;
  sectorId: string | null;
}

/** The subset of `VisibleTicket` (SVC-07) the access rules need. */
export interface RatingTicket {
  requesterId: string;
  assigneeId: string | null;
  sectorId: string;
  passedSectorIds: readonly string[];
  statusKey: string;
}

/** Codes the rating refuses with, in the order WF1 applies them. */
export type RatingRefusal = 'FORBIDDEN' | 'TICKET_NOT_FOUND' | 'RATING_TICKET_NOT_CLOSED';

export const CLOSED_STATUS_KEY = 'CLOSED';

/** The two roles that open tickets, and therefore the only ones that can be a requester (BR1.1). */
export const REQUESTER_ROLES: readonly Role[] = ['STUDENT', 'PROFESSOR'];

/** AGENT and MANAGER, the roles that always belong to one sector (BR3.3 of U1). */
function worksInSector(actor: RatingActor, sectorId: string): boolean {
  return requiresSector(actor.role) && actor.sectorId !== null && actor.sectorId === sectorId;
}

/**
 * BR1.3: the read rule is exactly the ticket visibility of U2 — the requester, the current
 * assignee, agents and managers of the current sector or of a sector the ticket passed through,
 * and the administrator.
 *
 * The administrator is inside the list, unlike the conversation of U3, which he does not read:
 * the rating judges the service that was delivered, which concerns whoever administers the
 * system, while the conversation may carry the personal matter that motivated the ticket. The
 * asymmetry is deliberate and is registered in BR1.3.
 *
 * Re-deriving the rule here is a second, narrowing check next to the one U2 already applied in
 * the query, the same shape `conversation-access` uses: the two can only agree or refuse.
 */
export function canReadRating(actor: RatingActor, ticket: RatingTicket): boolean {
  if (actor.role === 'ADMIN') {
    return true;
  }
  if (actor.id === ticket.requesterId || actor.id === ticket.assigneeId) {
    return true;
  }
  if (worksInSector(actor, ticket.sectorId)) {
    return true;
  }
  return ticket.passedSectorIds.some((sectorId) => worksInSector(actor, sectorId));
}

/** BR1.1: only the requester of this very ticket rates it. */
export function canRate(actor: RatingActor, ticket: RatingTicket): boolean {
  return REQUESTER_ROLES.includes(actor.role) && actor.id === ticket.requesterId;
}

/**
 * WF1 steps 4 and 5, in this order (BR1.1, BR1.2): a role that never rates is refused without
 * hiding the ticket, somebody who is not the requester is answered as if the ticket did not
 * exist, and a ticket that is not closed refuses even its own requester.
 *
 * The uniqueness of the rating is not decided here: it depends on what is already stored, which
 * only the service knows (BR2.3).
 */
export function rateRefusal(actor: RatingActor, ticket: RatingTicket): RatingRefusal | null {
  if (!REQUESTER_ROLES.includes(actor.role)) {
    return 'FORBIDDEN';
  }
  if (actor.id !== ticket.requesterId) {
    return 'TICKET_NOT_FOUND';
  }
  return ticket.statusKey === CLOSED_STATUS_KEY ? null : 'RATING_TICKET_NOT_CLOSED';
}

/** BR1.3: whoever may not read the rating answers as if the ticket did not exist. */
export function readRefusal(actor: RatingActor, ticket: RatingTicket): RatingRefusal | null {
  return canReadRating(actor, ticket) ? null : 'TICKET_NOT_FOUND';
}
