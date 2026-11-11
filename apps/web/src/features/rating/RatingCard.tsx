import {
  formatAverageScore,
  formatRatingSample,
  RATING_MAX_SCORE,
  RATING_MIN_SCORE,
} from './rating-labels';

interface RatingCardProps {
  /** Empty when the period holds no rating at all (BR3.2). */
  averageScore: number | null;
  count: number;
  testId: string;
}

/**
 * The average rating of the period, with its own sample beside it. Without a sample it shows a
 * dash and the explanation, never a zero read as if it were a score (BR3.2, BR5.4). The scale it
 * belongs to is written next to the number, so the value is never read blind, and no goal or
 * threshold ever travels with it.
 */
export function RatingCard({ averageScore, count, testId }: RatingCardProps) {
  const hasSample = count > 0 && averageScore !== null;
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-md border p-4" data-testid={testId}>
      <span className="text-sm text-muted-foreground">Avaliação média do atendimento</span>
      <span className="text-2xl font-semibold" data-testid={`${testId}-value`}>
        {formatAverageScore(averageScore, count)}
      </span>
      <span className="text-xs text-muted-foreground" data-testid={`${testId}-sample`}>
        {hasSample
          ? `De ${RATING_MIN_SCORE} a ${RATING_MAX_SCORE} · ${formatRatingSample(count)}`
          : 'Nenhuma avaliação nos chamados encerrados no período selecionado.'}
      </span>
      <span className="text-xs text-muted-foreground">
        Nota que os solicitantes deram ao atendimento, sobre os chamados encerrados no período.
      </span>
    </div>
  );
}
