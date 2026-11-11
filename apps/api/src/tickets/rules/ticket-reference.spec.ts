import { describe, expect, it } from '@jest/globals';
import { formatTicketReference, TICKET_REFERENCE_PREFIX } from './ticket-reference.js';

describe('visible ticket reference (BR1.6, Q1)', () => {
  it('writes a hash sign followed by the number', () => {
    expect(TICKET_REFERENCE_PREFIX).toBe('#');
    expect(formatTicketReference(42)).toBe('#42');
  });

  it('never adds leading zeros', () => {
    expect(formatTicketReference(1)).toBe('#1');
    expect(formatTicketReference(7)).toBe('#7');
  });

  it('keeps large numbers whole', () => {
    expect(formatTicketReference(1024)).toBe('#1024');
    expect(formatTicketReference(987_654)).toBe('#987654');
  });

  it('gives the same text for the same number every time', () => {
    expect(formatTicketReference(42)).toBe(formatTicketReference(42));
  });
});
