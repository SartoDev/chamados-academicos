const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const absoluteFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/** Full instant, used in the accessible title of every relative text (wireframes Tela 6). */
export function formatAbsoluteInstant(value: string): string {
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? '' : absoluteFormatter.format(instant);
}

/**
 * How long ago something happened, in Portuguese and in short form: "agora", "há 2 h",
 * "há 3 dias". The absolute instant always travels with it (AC5.3.4).
 */
export function formatTimeAgo(value: string, now: number = Date.now()): string {
  const instant = new Date(value).getTime();
  if (!Number.isFinite(instant)) {
    return '';
  }
  const elapsed = Math.max(0, now - instant);
  if (elapsed < MINUTE_MS) {
    return 'agora';
  }
  if (elapsed < HOUR_MS) {
    const minutes = Math.floor(elapsed / MINUTE_MS);
    return `há ${minutes} min`;
  }
  if (elapsed < DAY_MS) {
    const hours = Math.floor(elapsed / HOUR_MS);
    return `há ${hours} h`;
  }
  const days = Math.floor(elapsed / DAY_MS);
  return days === 1 ? 'há 1 dia' : `há ${days} dias`;
}
