/**
 * Reopen window of a closed ticket (BR4.3, AC1.6.2). Pure module: the current instant comes
 * from the caller, which reads it from the injectable clock, so the boundary is testable
 * without waiting for real time (M3).
 */
export const REOPEN_WINDOW_HOURS = 72;
export const REOPEN_WINDOW_MS = REOPEN_WINDOW_HOURS * 60 * 60 * 1000;

/**
 * True while less than 72 hours have passed since the ticket was closed: 71h59 is accepted and
 * 72h00 is not. A closed ticket without the closing instant is treated as out of the window,
 * because there is no instant to count from.
 */
export function isWithinReopenWindow(closedAt: Date | null | undefined, now: Date): boolean {
  if (!closedAt) {
    return false;
  }
  return now.getTime() - closedAt.getTime() < REOPEN_WINDOW_MS;
}

export function reopenWindowRefusal(
  closedAt: Date | null | undefined,
  now: Date,
): 'TICKET_REOPEN_WINDOW_EXPIRED' | null {
  return isWithinReopenWindow(closedAt, now) ? null : 'TICKET_REOPEN_WINDOW_EXPIRED';
}
