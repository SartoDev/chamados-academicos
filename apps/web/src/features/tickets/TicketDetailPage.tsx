import { Link, useLocation, useParams } from 'react-router';
import { ApiError } from '@/app/api/api-client';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/features/auth/use-session';
import { useConversationTab } from '@/features/conversation/use-conversation-tab';
import { RatingSection } from '@/features/rating/RatingSection';
import { TicketActions } from './TicketActions';
import { TicketHeader } from './TicketHeader';
import { TicketTabs } from './TicketTabs';
import { useTicket } from './tickets-api';

/** Tela 5: the detail of a ticket the actor may see; anything else is "not found" (BR2.4). */
export function TicketDetailPage() {
  const { ticketId = '' } = useParams();
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;
  const { user } = useSession();
  const ticket = useTicket(ticketId);
  // U3 registers the Conversa tab through the extension point of TicketTabs (BR5.1).
  const conversation = useConversationTab(ticket.data, user);

  if (ticket.isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col gap-3"
        data-testid="ticket-detail-loading"
      >
        <span className="sr-only">Carregando...</span>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (ticket.isError) {
    const notFound = ticket.error instanceof ApiError && ticket.error.status === 404;
    return (
      <section
        role="alert"
        className="flex flex-col items-start gap-3"
        data-testid="ticket-detail-error"
      >
        <h1 className="text-xl font-semibold">
          {notFound ? 'Chamado não encontrado' : 'Não foi possível carregar o chamado'}
        </h1>
        <p className="text-sm">
          {notFound
            ? 'O chamado não existe ou não está disponível para o seu perfil.'
            : messageForError(ticket.error)}
        </p>
        {notFound ? (
          <Button asChild variant="outline" data-testid="ticket-detail-back-link">
            <Link to="/">Voltar ao início</Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => void ticket.refetch()}
            data-testid="ticket-detail-retry-button"
          >
            Tentar novamente
          </Button>
        )}
      </section>
    );
  }

  return (
    <section className="flex min-w-0 flex-col gap-4">
      {notice && (
        <p
          role="status"
          className="rounded-md border p-2 text-sm"
          data-testid="ticket-detail-notice"
        >
          {notice}
        </p>
      )}
      <TicketHeader ticket={ticket.data} />
      {user && <TicketActions ticket={ticket.data} user={user} />}
      <TicketTabs
        key={conversation.tabsKey}
        ticket={ticket.data}
        extraTabs={conversation.tabs}
        // U5 puts the rating inside the Detalhes tab, not in a tab of its own (BR5.1 of U5).
        detailsExtra={user ? <RatingSection ticket={ticket.data} user={user} /> : undefined}
      />
    </section>
  );
}
