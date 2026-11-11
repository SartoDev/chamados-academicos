import { DomainError, type DomainErrorOptions } from '../common/errors/domain-error.js';
import type { TicketRefusal } from './rules/ticket-action-policy.js';

export type TicketRefusalCode =
  | TicketRefusal
  | 'TICKET_QUEUE_NO_SECTOR'
  | 'TICKET_INVALID_TRANSITION'
  | 'TICKET_REOPEN_WINDOW_EXPIRED';

/** Debug fallbacks only: the frontend shows the Portuguese text of each code (CT11). */
const REFUSAL_MESSAGES: Record<TicketRefusalCode, string> = {
  FORBIDDEN: 'The actor may not perform this action on this ticket',
  TICKET_CLOSED: 'The ticket is closed',
  TICKET_ALREADY_ASSIGNED: 'The ticket already has an available assignee',
  TICKET_ASSIGNEE_NOT_IN_SECTOR: 'The chosen person cannot receive tickets of this sector',
  TICKET_TRANSFER_SAME_SECTOR: 'The destination must be a sector other than the current one',
  TICKET_QUEUE_NO_SECTOR: 'The actor is not linked to a sector',
  TICKET_INVALID_TRANSITION: 'The ticket does not accept this change in its current status',
  TICKET_REOPEN_WINDOW_EXPIRED: 'The reopen window has expired',
};

/** BR2.4: a ticket that does not exist and one the actor cannot see answer identically. */
export function ticketNotFound(): DomainError {
  return new DomainError('TICKET_NOT_FOUND', 'Ticket not found');
}

export function ticketRefusal(
  code: TicketRefusalCode,
  options: DomainErrorOptions = {},
): DomainError {
  return new DomainError(code, REFUSAL_MESSAGES[code], options);
}

export function invalidTransition(): DomainError {
  return ticketRefusal('TICKET_INVALID_TRANSITION');
}
