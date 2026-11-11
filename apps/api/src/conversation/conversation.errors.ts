import { DomainError } from '../common/errors/domain-error.js';
import type { ConversationRefusal } from './rules/conversation-access.js';

/**
 * Debug fallbacks only: the frontend shows the Portuguese text of each code (CT11, BR5.7).
 *
 * `TICKET_NOT_FOUND` repeats, character for character, the message U2 answers for a ticket that
 * does not exist or is invisible. BR1.1 requires the two answers to be indistinguishable, and
 * the conversation produces its own 404 for an actor who sees the ticket but not the
 * conversation — an administrator, above all. An integration test compares the bodies.
 */
const REFUSAL_MESSAGES: Record<ConversationRefusal, string> = {
  TICKET_NOT_FOUND: 'Ticket not found',
  FORBIDDEN: 'The actor may not write in the conversation of this ticket',
  MESSAGE_TICKET_CLOSED: 'The ticket is closed and does not accept new messages',
};

export function conversationRefusal(code: ConversationRefusal): DomainError {
  return new DomainError(code, REFUSAL_MESSAGES[code]);
}

/** BR1.1, BR1.2, BR1.4: the conversation of a ticket the actor may not read does not exist. */
export function conversationNotFound(): DomainError {
  return conversationRefusal('TICKET_NOT_FOUND');
}

/** BR2.1: the body is refused with the field-specific code of X-01 (BR6.3 of U1). */
export function invalidMessageBody(code: 'REQUIRED' | 'TOO_LONG'): DomainError {
  return new DomainError('VALIDATION_FAILED', 'Invalid message body', {
    details: [{ field: 'body', code }],
  });
}
