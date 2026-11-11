import type { CurrentUser, TicketDetail } from '@/app/api/types';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingForm } from './RatingForm';
import { RatingSummaryView } from './RatingSummaryView';
import { useTicketRating } from './rating-api';

interface RatingSectionProps {
  ticket: TicketDetail;
  user: CurrentUser;
}

/**
 * The rating block inside the Detalhes tab of the ticket (BR5.1, BR5.2). It is not a tab of its
 * own: the rating is information about the ticket, and it reaches the tab through the extra
 * content extension point of `TicketTabs`.
 *
 * Nothing at all is shown while the ticket is not closed, which is also when nothing can be
 * rated (BR1.2). On a closed ticket, the requester who has not rated yet gets the form, and
 * everybody who may read the ticket gets the stored rating; a closed ticket with no rating shows
 * nothing to whoever cannot rate it. The real protection is on the server (BR1.1 to BR1.3).
 */
export function RatingSection({ ticket, user }: RatingSectionProps) {
  const closed = ticket.status.key === 'CLOSED';
  const rating = useTicketRating(ticket.id, closed);

  if (!closed) {
    return null;
  }

  if (rating.isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col gap-2"
        data-testid="rating-section-loading"
      >
        <span className="sr-only">Carregando a avaliação...</span>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (rating.isError) {
    return (
      <section
        role="alert"
        className="flex flex-col items-start gap-2 rounded-md border p-4"
        data-testid="rating-section-error"
      >
        <p className="text-sm">
          Não foi possível carregar a avaliação. {messageForError(rating.error)}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void rating.refetch()}
          data-testid="rating-section-retry-button"
        >
          Tentar novamente
        </Button>
      </section>
    );
  }

  if (rating.data) {
    return <RatingSummaryView rating={rating.data} />;
  }

  return user.id === ticket.requester.id ? <RatingForm ticketId={ticket.id} /> : null;
}
