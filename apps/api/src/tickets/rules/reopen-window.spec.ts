import { describe, expect, it } from '@jest/globals';
import { isWithinReopenWindow, REOPEN_WINDOW_MS, reopenWindowRefusal } from './reopen-window.js';

const CLOSED_AT = new Date('2026-09-01T12:00:00.000Z');
const ONE_MINUTE_MS = 60_000;

function hoursAfterClosing(hours: number, minutes = 0): Date {
  return new Date(CLOSED_AT.getTime() + hours * 60 * ONE_MINUTE_MS + minutes * ONE_MINUTE_MS);
}

describe('reopen window (BR4.3, AC1.6.2)', () => {
  it('counts exactly 72 hours from the closing instant', () => {
    expect(REOPEN_WINDOW_MS).toBe(72 * 60 * 60 * 1000);
  });

  it('accepts a reopening at 71h59 and refuses it at 72h00', () => {
    expect(isWithinReopenWindow(CLOSED_AT, hoursAfterClosing(71, 59))).toBe(true);
    expect(isWithinReopenWindow(CLOSED_AT, hoursAfterClosing(72))).toBe(false);
  });

  it('answers the refusal code only after the window closed', () => {
    expect(reopenWindowRefusal(CLOSED_AT, hoursAfterClosing(71, 59))).toBeNull();
    expect(reopenWindowRefusal(CLOSED_AT, hoursAfterClosing(72))).toBe(
      'TICKET_REOPEN_WINDOW_EXPIRED',
    );
    expect(reopenWindowRefusal(CLOSED_AT, hoursAfterClosing(240))).toBe(
      'TICKET_REOPEN_WINDOW_EXPIRED',
    );
  });

  it('accepts a reopening right after the closing', () => {
    expect(isWithinReopenWindow(CLOSED_AT, CLOSED_AT)).toBe(true);
    expect(isWithinReopenWindow(CLOSED_AT, hoursAfterClosing(0, 1))).toBe(true);
  });

  it('refuses when there is no closing instant to count from', () => {
    expect(isWithinReopenWindow(null, CLOSED_AT)).toBe(false);
    expect(isWithinReopenWindow(undefined, CLOSED_AT)).toBe(false);
    expect(reopenWindowRefusal(null, CLOSED_AT)).toBe('TICKET_REOPEN_WINDOW_EXPIRED');
  });
});
