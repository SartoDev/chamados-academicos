import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ListStatus } from '@/app/components/list-status';
import { ListState } from '@/app/components/ListState';
import type { Message, TicketDetail } from '@/app/api/types';
import { isRequesterMessage, newMessagesAnnouncement } from './conversation-rules';
import { LoadPreviousButton } from './LoadPreviousButton';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: readonly Message[];
  ticket: TicketDetail;
  status: ListStatus;
  errorMessage: string;
  onRetry: () => void;
  hasPrevious: boolean;
  loadingPrevious: boolean;
  onLoadPrevious: () => void;
}

function newestInstant(messages: readonly Message[]): number {
  return messages.reduce((newest, message) => Math.max(newest, Date.parse(message.sentAt)), 0);
}

/**
 * The bubbles in chronological order, inside a polite region that announces only the messages a
 * load brought in newer than the ones already on screen (BR3.1, BR5.5, BR5.6). Older messages
 * fetched by "Carregar mensagens anteriores" are never announced, and the reading position is
 * kept by restoring the distance to the bottom after they are prepended.
 */
export function MessageList({
  messages,
  ticket,
  status,
  errorMessage,
  onRetry,
  hasPrevious,
  loadingPrevious,
  onLoadPrevious,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const distanceToBottom = useRef<number | null>(null);
  const seen = useRef<{ ids: Set<string>; newest: number } | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const ids = new Set(messages.map((message) => message.id));
    const newest = newestInstant(messages);
    const previous = seen.current;
    seen.current = { ids, newest };
    if (previous === null) {
      // The first load is the conversation itself, not an arrival: nothing to announce.
      return;
    }
    const arrived = messages.filter(
      (message) => !previous.ids.has(message.id) && Date.parse(message.sentAt) > previous.newest,
    );
    setAnnouncement(newMessagesAnnouncement(arrived.length));
  }, [messages]);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }
    if (distanceToBottom.current !== null) {
      // Older messages were prepended: keep the reader where they were reading.
      node.scrollTop = node.scrollHeight - distanceToBottom.current;
      distanceToBottom.current = null;
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  const handleLoadPrevious = () => {
    const node = scrollRef.current;
    distanceToBottom.current = node ? node.scrollHeight - node.scrollTop : null;
    onLoadPrevious();
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p aria-live="polite" role="status" className="sr-only" data-testid="conversation-announcer">
        {announcement}
      </p>
      <ListState
        status={status}
        emptyMessage="Nenhuma mensagem ainda. Escreva a primeira."
        errorMessage={errorMessage}
        onRetry={onRetry}
        skeletonRows={3}
      >
        <div
          ref={scrollRef}
          className="flex max-h-[28rem] min-w-0 flex-col gap-3 overflow-y-auto rounded-md border p-3"
          data-testid="conversation-message-scroll"
        >
          <LoadPreviousButton
            hasPrevious={hasPrevious}
            loading={loadingPrevious}
            onLoad={handleLoadPrevious}
          />
          <ol className="flex min-w-0 flex-col gap-3" data-testid="conversation-message-list">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                fromRequester={isRequesterMessage(message, ticket)}
              />
            ))}
          </ol>
        </div>
      </ListState>
    </div>
  );
}
