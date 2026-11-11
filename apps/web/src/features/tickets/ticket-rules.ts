import type { CurrentUser, TicketDetail, TicketListItem } from '@/app/api/types';

/** BR4.3: the requester reopens a closed ticket for 72 hours after the closing. */
export const REOPEN_WINDOW_MS = 72 * 60 * 60 * 1000;

export interface TicketActionAvailability {
  assume: boolean;
  assign: boolean;
  transfer: boolean;
  waitForRequester: boolean;
  close: boolean;
  reopen: boolean;
  changePriority: boolean;
}

export function isWithinReopenWindow(closedAt: string | null, now: number = Date.now()): boolean {
  if (!closedAt) {
    return false;
  }
  const closedInstant = new Date(closedAt).getTime();
  return Number.isFinite(closedInstant) && now - closedInstant < REOPEN_WINDOW_MS;
}

export function worksInSectorOf(user: CurrentUser, ticket: Pick<TicketDetail, 'sector'>): boolean {
  return (user.role === 'AGENT' || user.role === 'MANAGER') && user.sector?.id === ticket.sector.id;
}

/** BR3.1, BR3.9: a ticket without assignee, or whose assignee became unavailable, is free. */
export function canAssume(user: CurrentUser, ticket: TicketListItem): boolean {
  if (!worksInSectorOf(user, ticket) || ticket.status.key === 'CLOSED') {
    return false;
  }
  if (!ticket.assignee) {
    return true;
  }
  if (ticket.assigneeUnavailable) {
    return true;
  }
  // The assignee takes the ticket back after a reopening (BR3.1).
  return ticket.assignee.id === user.id && ticket.status.key === 'OPEN';
}

/**
 * Mirror of the server policy, so the detail screen offers only the actions the actor may run
 * (BR9.4). The server decides; a stale screen is answered with 403 or 409 and reloaded.
 */
export function availableTicketActions(
  user: CurrentUser,
  ticket: TicketDetail,
  now: number = Date.now(),
): TicketActionAvailability {
  const isRequesterRole = user.role === 'STUDENT' || user.role === 'PROFESSOR';
  const isRequester = isRequesterRole && ticket.requester.id === user.id;
  const inSector = worksInSectorOf(user, ticket);
  const isAssignee = ticket.assignee?.id === user.id;
  const isSectorManager = user.role === 'MANAGER' && inSector;
  const isClosed = ticket.status.key === 'CLOSED';

  return {
    assume: canAssume(user, ticket),
    assign: isSectorManager && !isClosed,
    transfer: inSector && !isClosed,
    waitForRequester:
      inSector && ticket.status.key === 'IN_ANALYSIS' && (isAssignee || isSectorManager),
    close: !isClosed && (isRequester || (inSector && (isAssignee || isSectorManager))),
    reopen: isRequester && isClosed && isWithinReopenWindow(ticket.closedAt, now),
    changePriority: inSector && !isClosed,
  };
}

export function hasAnyTicketAction(actions: TicketActionAvailability): boolean {
  return Object.values(actions).some(Boolean);
}
