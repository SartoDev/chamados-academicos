import type { ReportPeriod } from './reports-api';

/** Last thirty calendar days, counting the current one (BR7.2). */
export const DEFAULT_PERIOD_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** A day in the address, as the date inputs write it: `yyyy-mm-dd`. */
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDayString(instant: Date): string {
  return instant.toISOString().slice(0, 10);
}

export interface PeriodDays {
  from: string;
  to: string;
}

/**
 * The window the panel opens on: the current day as the end, included, and twenty-nine days
 * before it as the start. The bounds travel in the address as days, so a reload or a shared
 * link lands on the same numbers (BR7.2).
 */
export function defaultPeriodDays(now: Date = new Date()): PeriodDays {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return {
    from: toDayString(new Date(to.getTime() - (DEFAULT_PERIOD_DAYS - 1) * DAY_MS)),
    to: toDayString(to),
  };
}

export function isValidDay(value: string): boolean {
  return DAY_PATTERN.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

/**
 * BR2.1: the start is included and the end is excluded, so the day the person chose as the end
 * is turned into the first instant of the following day and is itself part of the window.
 */
export function toReportPeriod(days: PeriodDays): ReportPeriod {
  const end = new Date(`${days.to}T00:00:00.000Z`);
  return {
    from: new Date(`${days.from}T00:00:00.000Z`).toISOString(),
    to: new Date(end.getTime() + DAY_MS).toISOString(),
  };
}

/** Message shown next to the selector, or empty when the period may be sent (BR2.1). */
export function periodError(days: PeriodDays): string | null {
  if (!isValidDay(days.from) || !isValidDay(days.to)) {
    return 'Informe datas válidas para o início e o fim do período.';
  }
  if (new Date(`${days.from}T00:00:00.000Z`) > new Date(`${days.to}T00:00:00.000Z`)) {
    return 'A data de início deve ser anterior ou igual à data de fim.';
  }
  return null;
}

const dayFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', dateStyle: 'short' });

export function formatDay(day: string): string {
  return isValidDay(day) ? dayFormatter.format(new Date(`${day}T00:00:00.000Z`)) : day;
}

interface DurationParts {
  days: number;
  hours: number;
  minutes: number;
}

function splitDuration(seconds: number): DurationParts {
  const total = Math.max(0, Math.round(seconds));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
  };
}

/** Short form shown as the value of the card: `2 d 4 h`, `4 h 30 min`, `12 min`. */
export function formatDurationShort(seconds: number): string {
  const { days, hours, minutes } = splitDuration(seconds);
  if (days > 0) {
    return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }
  return `${minutes} min`;
}

function plural(value: number, singular: string, many: string): string {
  return `${value} ${value === 1 ? singular : many}`;
}

/**
 * The same value written out, shown next to the number so nothing depends on reading an
 * abbreviation (BR7.4).
 */
export function formatDurationLong(seconds: number): string {
  const { days, hours, minutes } = splitDuration(seconds);
  const parts: string[] = [];
  if (days > 0) {
    parts.push(plural(days, 'dia', 'dias'));
  }
  if (hours > 0) {
    parts.push(plural(hours, 'hora', 'horas'));
  }
  if (minutes > 0 && days === 0) {
    parts.push(plural(minutes, 'minuto', 'minutos'));
  }
  if (parts.length === 0) {
    return 'menos de um minuto';
  }
  return parts.length === 1 ? parts[0]! : `${parts.slice(0, -1).join(', ')} e ${parts.at(-1)!}`;
}

/** How many tickets a given average came out of, written out next to it (BR4.3). */
export function formatSample(sampleSize: number): string {
  return sampleSize === 1 ? 'Base: 1 chamado' : `Base: ${sampleSize} chamados`;
}
