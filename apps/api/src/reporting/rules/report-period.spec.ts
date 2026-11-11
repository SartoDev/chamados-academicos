import { describe, expect, it } from '@jest/globals';
import { FakeClock } from '../../../test/support/fake-clock.js';
import { expectDomainError } from '../../../test/support/expect-domain-error.js';
import type { FieldErrorDetail } from '../../common/errors/domain-error.js';
import { DEFAULT_PERIOD_DAYS, resolveReportPeriod } from './report-period.js';

const NOW = new Date('2026-09-24T15:30:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

/** The rule never reads the wall clock: the tests hand it the instant they choose. */
const clock = new FakeClock(NOW);

describe('report period (BR2.1, BR7.2)', () => {
  it('keeps both bounds the caller sent, normalized to UTC', () => {
    const period = resolveReportPeriod(
      { from: '2026-09-01T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' },
      clock.now(),
    );

    expect(period).toEqual({ from: '2026-09-01T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' });
  });

  it('takes the instant of the clock as the end when it is omitted', () => {
    const period = resolveReportPeriod({ from: '2026-09-01T00:00:00.000Z' }, clock.now());

    expect(period.to).toBe(NOW.toISOString());
  });

  it('opens on the last thirty days when no bound is sent, counted by the clock', () => {
    const period = resolveReportPeriod({}, clock.now());

    expect(period.to).toBe(NOW.toISOString());
    expect(period.from).toBe(new Date(NOW.getTime() - DEFAULT_PERIOD_DAYS * DAY_MS).toISOString());
    expect(DEFAULT_PERIOD_DAYS).toBe(30);
  });

  it('counts the thirty days back from the end the caller sent, not from the clock', () => {
    const period = resolveReportPeriod({ to: '2026-06-30T00:00:00.000Z' }, clock.now());

    expect(period.from).toBe('2026-05-31T00:00:00.000Z');
  });

  it('refuses a malformed start naming the field', async () => {
    const error = await expectDomainError(
      () => resolveReportPeriod({ from: 'ontem', to: '2026-10-01T00:00:00.000Z' }, clock.now()),
      'VALIDATION_FAILED',
    );

    expect(error.details).toEqual([{ field: 'from', code: 'INVALID_DATE' }]);
    expect(error.status).toBe(400);
  });

  it('refuses both malformed bounds at once, naming each field', async () => {
    const error = await expectDomainError(
      () => resolveReportPeriod({ from: '2026-13-45', to: 'depois' }, clock.now()),
      'VALIDATION_FAILED',
    );

    expect(error.details as FieldErrorDetail[]).toEqual([
      { field: 'from', code: 'INVALID_DATE' },
      { field: 'to', code: 'INVALID_DATE' },
    ]);
  });

  it('refuses an inverted period', async () => {
    const error = await expectDomainError(
      () =>
        resolveReportPeriod(
          { from: '2026-10-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
          clock.now(),
        ),
      'VALIDATION_FAILED',
    );

    expect(error.details).toEqual([{ field: 'from', code: 'INVALID_RANGE' }]);
  });

  it('refuses a period whose start equals its end, because the end is excluded', async () => {
    await expectDomainError(
      () =>
        resolveReportPeriod(
          { from: '2026-09-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
          clock.now(),
        ),
      'VALIDATION_FAILED',
    );
  });
});
