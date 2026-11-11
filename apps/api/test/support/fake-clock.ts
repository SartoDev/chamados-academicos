import { Clock } from '../../src/common/clock.js';

/** Controlled time source: tests move time forward instead of waiting for it. */
export class FakeClock extends Clock {
  private current: Date;

  constructor(start: Date = new Date('2026-09-01T12:00:00.000Z')) {
    super();
    this.current = new Date(start);
  }

  now(): Date {
    return new Date(this.current);
  }

  advanceBy(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }

  set(instant: Date): void {
    this.current = new Date(instant);
  }
}

export const ONE_MINUTE_MS = 60_000;
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
