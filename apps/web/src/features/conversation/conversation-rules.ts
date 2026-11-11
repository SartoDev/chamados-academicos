import type { CurrentUser, Message, TicketDetail } from '@/app/api/types';
import { worksInSectorOf } from '@/features/tickets/ticket-rules';

/** Client-side mirror of BR2.1; the server stays the authority (Q3). */
export const MESSAGE_BODY_MIN_LENGTH = 1;
export const MESSAGE_BODY_MAX_LENGTH = 2000;

/** A bubble longer than this is folded to six lines with a "ver mais" control (BR5.4). */
export const BUBBLE_TRUNCATION_LINES = 6;
const BUBBLE_TRUNCATION_CHARACTERS = 400;

/**
 * BR5.1: the tab is offered to the requester of the ticket and to every agent and manager,
 * never to the administrator. The client cannot decide who reads by sector passage, because the
 * ticket detail does not carry the sectors the ticket passed through; the server decides, and
 * the 404 of the first read removes the tab. The real protection is BR1.2 and BR1.4.
 */
export function canSeeConversationTab(user: CurrentUser, ticket: TicketDetail): boolean {
  if (user.role === 'ADMIN') {
    return false;
  }
  if (user.role === 'AGENT' || user.role === 'MANAGER') {
    return true;
  }
  return ticket.requester.id === user.id;
}

/**
 * BR1.3: mirror of the write rule, so the composer only appears for whoever may write. The
 * server reconfirms on every send; a stale screen is answered with 403 and reloaded.
 */
export function canWriteMessage(user: CurrentUser, ticket: TicketDetail): boolean {
  if (user.role === 'ADMIN') {
    return false;
  }
  if (ticket.requester.id === user.id || ticket.assignee?.id === user.id) {
    return true;
  }
  return user.role === 'MANAGER' && worksInSectorOf(user, ticket);
}

/** BR5.1: the requester on one side, the attendance on the other. */
export function isRequesterMessage(message: Message, ticket: TicketDetail): boolean {
  return message.author.id === ticket.requester.id;
}

/** Whether a body is long enough to be worth folding; the exact height is decided by CSS. */
export function isTruncatable(body: string): boolean {
  return (
    body.split('\n').length > BUBBLE_TRUNCATION_LINES || body.length > BUBBLE_TRUNCATION_CHARACTERS
  );
}

/** BR5.5: what the polite region announces when a load brings messages newer than the last. */
export function newMessagesAnnouncement(count: number): string {
  if (count <= 0) {
    return '';
  }
  return count === 1 ? '1 nova mensagem.' : `${count} novas mensagens.`;
}
