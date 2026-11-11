/**
 * Visible identifier of a ticket (BR1.6, Q1): a hash sign followed by the sequential number of
 * the database, with no leading zeros. Pure module.
 */
export const TICKET_REFERENCE_PREFIX = '#';

export function formatTicketReference(number: number): string {
  return `${TICKET_REFERENCE_PREFIX}${number}`;
}
