import { DomainError } from '../common/errors/domain-error.js';
import type { RatingRefusal } from './rules/rating-access.js';

/**
 * Debug fallbacks only: the frontend shows the Portuguese text of each code (CT11, BR5.6).
 *
 * `TICKET_NOT_FOUND` repeats, character for character, the message U2 answers for a ticket that
 * does not exist or is invisible. BR1.1 and BR1.3 require the two answers to be
 * indistinguishable, and U5 produces its own 404 for an actor who sees the ticket but is not its
 * requester. An integration test compares the bodies.
 */
const REFUSAL_MESSAGES: Record<RatingRefusal, string> = {
  FORBIDDEN: 'The actor may not rate a ticket',
  TICKET_NOT_FOUND: 'Ticket not found',
  RATING_TICKET_NOT_CLOSED: 'The ticket is not closed and cannot be rated yet',
};

/**
 * The three refusals of the access rules, including the `TICKET_NOT_FOUND` a rating the actor
 * may not reach answers with (BR1.1, BR1.3).
 */
export function ratingRefusal(code: RatingRefusal): DomainError {
  return new DomainError(code, REFUSAL_MESSAGES[code]);
}

/** BR1.3: the ticket is visible and simply has no rating yet. */
export function ratingNotFound(): DomainError {
  return new DomainError('RATING_NOT_FOUND', 'The ticket has not been rated');
}

/** BR2.3: the first rating stands; a second attempt is refused whatever the score. */
export function ratingAlreadyExists(): DomainError {
  return new DomainError('RATING_ALREADY_EXISTS', 'The ticket has already been rated');
}

/** BR2.1, BR2.2: content refused with the field-specific code of X-01 (BR6.3 of U1). */
export function invalidRatingField(field: 'score' | 'comment', code: string): DomainError {
  return new DomainError('VALIDATION_FAILED', `Invalid rating ${field}`, {
    details: [{ field, code }],
  });
}
