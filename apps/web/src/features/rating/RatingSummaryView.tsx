import type { Rating } from '@/app/api/types';
import { formatScore } from './rating-labels';

const instantFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatInstant(iso: string): string {
  const instant = new Date(iso);
  return Number.isNaN(instant.getTime()) ? iso : instantFormatter.format(instant);
}

interface RatingSummaryViewProps {
  rating: Rating;
  /** Shown once, right after the rating is stored, so the send has a visible outcome (WF1). */
  notice?: string | null;
}

/**
 * The stored rating: the score with its label written out, the comment when there is one, and
 * the instant it was left. The score never travels as a star or as a colour alone (BR5.2,
 * BR5.5, AC5.3.4), and the comment is shown as plain text with its line breaks preserved and no
 * markup interpreted (BR2.2).
 */
export function RatingSummaryView({ rating, notice }: RatingSummaryViewProps) {
  return (
    <section
      aria-labelledby="rating-summary-title"
      className="flex min-w-0 flex-col gap-2 rounded-md border p-4"
      data-testid="rating-summary"
    >
      <h3 id="rating-summary-title" className="text-lg font-semibold">
        Avaliação do atendimento
      </h3>
      {notice && (
        <p role="status" className="text-sm" data-testid="rating-summary-notice">
          {notice}
        </p>
      )}
      <p className="text-2xl font-semibold" data-testid="rating-summary-score">
        {formatScore(rating.score)}
      </p>
      {rating.comment ? (
        <p className="text-sm break-words whitespace-pre-wrap" data-testid="rating-summary-comment">
          {rating.comment}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground" data-testid="rating-summary-no-comment">
          Sem comentário.
        </p>
      )}
      <p className="text-xs text-muted-foreground" data-testid="rating-summary-rated-at">
        Avaliado em {formatInstant(rating.ratedAt)}
      </p>
    </section>
  );
}
