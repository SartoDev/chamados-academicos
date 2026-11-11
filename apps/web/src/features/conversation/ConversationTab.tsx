import { useEffect, useMemo } from 'react';
import { ApiError } from '@/app/api/api-client';
import type { CurrentUser, TicketDetail } from '@/app/api/types';
import type { ListStatus } from '@/app/components/list-status';
import { messageForError } from '@/app/i18n/error-code-messages';
import { mergeMessagePages, useConversation } from './conversation-api';
import { canWriteMessage } from './conversation-rules';
import { ConversationRefreshButton } from './ConversationRefreshButton';
import { MessageComposer } from './MessageComposer';
import { MessageList } from './MessageList';

interface ConversationTabProps {
  ticket: TicketDetail;
  user: CurrentUser;
  /** BR5.1: the 404 of the first read tells the detail to drop the tab. */
  onUnavailable: () => void;
}

/**
 * Tela 5: the conversation of the ticket. It opens on the most recent page, shows it in
 * chronological order, and refreshes when the tab opens, after every send and on "Atualizar"
 * (BR5.4, BR5.5). It never polls and never keeps a connection open.
 */
export function ConversationTab({ ticket, user, onUnavailable }: ConversationTabProps) {
  const conversation = useConversation(ticket.id);
  const unavailable = conversation.error instanceof ApiError && conversation.error.status === 404;

  useEffect(() => {
    if (unavailable) {
      onUnavailable();
    }
  }, [unavailable, onUnavailable]);

  const messages = useMemo(
    () => mergeMessagePages(conversation.data?.pages ?? []),
    [conversation.data],
  );

  if (unavailable) {
    // The detail is dropping the tab in this same render pass; nothing is revealed meanwhile.
    return null;
  }

  const status: ListStatus = conversation.isPending
    ? 'loading'
    : conversation.isError
      ? 'error'
      : messages.length > 0
        ? 'ready'
        : 'empty';

  return (
    <section className="flex min-w-0 flex-col gap-4" data-testid="conversation-tab">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Conversa</h2>
        <ConversationRefreshButton
          refreshing={conversation.isFetching}
          onRefresh={() => void conversation.refetch()}
        />
      </div>

      <MessageList
        messages={messages}
        ticket={ticket}
        status={status}
        errorMessage={`Não foi possível carregar a conversa. ${messageForError(conversation.error)}`}
        onRetry={() => void conversation.refetch()}
        hasPrevious={conversation.hasNextPage}
        loadingPrevious={conversation.isFetchingNextPage}
        onLoadPrevious={() => void conversation.fetchNextPage()}
      />

      {canWriteMessage(user, ticket) && (
        <MessageComposer ticketId={ticket.id} closed={ticket.status.key === 'CLOSED'} />
      )}
    </section>
  );
}
