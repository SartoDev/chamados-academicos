import { formatDurationLong, formatDurationShort, formatSample } from './report-period';

interface DurationCardProps {
  label: string;
  /** Empty when this average has no sample of its own (BR4.3). */
  seconds: number | null;
  /** Sample of this average alone: resolution and handling have different populations. */
  sampleSize: number;
  /** Explains which instants the average runs between, so the number is never read blind. */
  description: string;
  testId: string;
}

/**
 * One average duration, in a readable unit and written out next to the number, with its own
 * sample beside it. Without a sample it shows a dash and the explanation, never a zero, and no
 * goal or threshold ever travels with it (BR4.3, BR4.4, BR7.4).
 */
export function DurationCard({
  label,
  seconds,
  sampleSize,
  description,
  testId,
}: DurationCardProps) {
  const hasSample = sampleSize > 0 && seconds !== null;
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-md border p-4" data-testid={testId}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold" data-testid={`${testId}-value`}>
        {hasSample ? formatDurationShort(seconds) : '—'}
      </span>
      <span className="text-xs text-muted-foreground" data-testid={`${testId}-sample`}>
        {hasSample
          ? `${formatDurationLong(seconds)} · ${formatSample(sampleSize)}`
          : 'Nenhum chamado encerrado no período selecionado.'}
      </span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </div>
  );
}
