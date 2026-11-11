import { DomainError, type FieldErrorDetail } from '../../common/errors/domain-error.js';

/**
 * Period of every number of U4 (BR2.1). Pure module: it turns the two optional bounds the
 * client sends into the closed-open window the queries receive, or refuses naming the field.
 * The time source is handed in, so the default window is decided by a controlled clock in the
 * tests instead of by real time.
 */
export const DEFAULT_PERIOD_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReportPeriodInput {
  /** ISO 8601 instant; the window includes it. */
  from?: string;
  /** ISO 8601 instant; the window excludes it. */
  to?: string;
}

export interface ReportPeriod {
  from: string;
  to: string;
}

function parseBound(
  value: string | undefined,
  field: 'from' | 'to',
  details: FieldErrorDetail[],
): Date | null {
  if (value === undefined) {
    return null;
  }
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    details.push({ field, code: 'INVALID_DATE' });
    return null;
  }
  return instant;
}

/**
 * BR2.1, BR7.2: both bounds are optional and independent. A missing end is the current instant
 * and a missing start is thirty days before the end, which is the window the panel opens on. A
 * malformed bound and a start that does not come before the end are both refused naming the
 * field; every other combination produces a window closed at the start and open at the end.
 */
export function resolveReportPeriod(input: ReportPeriodInput, now: Date): ReportPeriod {
  const details: FieldErrorDetail[] = [];
  const parsedFrom = parseBound(input.from, 'from', details);
  const parsedTo = parseBound(input.to, 'to', details);
  if (details.length > 0) {
    throw new DomainError('VALIDATION_FAILED', 'Invalid report period', { details });
  }
  const to = parsedTo ?? new Date(now);
  const from = parsedFrom ?? new Date(to.getTime() - DEFAULT_PERIOD_DAYS * DAY_MS);
  if (from.getTime() >= to.getTime()) {
    throw new DomainError('VALIDATION_FAILED', 'Report period start is not before its end', {
      details: [{ field: 'from', code: 'INVALID_RANGE' }],
    });
  }
  return { from: from.toISOString(), to: to.toISOString() };
}
