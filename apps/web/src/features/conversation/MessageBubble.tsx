import { useState } from 'react';
import type { Message } from '@/app/api/types';
import { Button } from '@/components/ui/button';
import { formatAbsoluteInstant, formatTimeAgo } from '@/features/tickets/relative-time';
import { cn } from '@/lib/utils';
import { isTruncatable } from './conversation-rules';

interface MessageBubbleProps {
  message: Message;
  /** BR5.1: the requester on one side of the conversation, the attendance on the other. */
  fromRequester: boolean;
}

/**
 * One message with its author and the instant it was sent. The side is a visual aid only: the
 * author is always written out, so nothing is carried by position or colour alone (AC5.3.4).
 */
export function MessageBubble({ message, fromRequester }: MessageBubbleProps) {
  const [expanded, setExpanded] = useState(false);
  const truncatable = isTruncatable(message.body);
  const bodyId = `message-${message.id}-body`;

  return (
    <li
      className={cn('flex min-w-0 flex-col', fromRequester ? 'items-start' : 'items-end')}
      data-testid="message-bubble"
      data-side={fromRequester ? 'requester' : 'attendance'}
    >
      <article
        className={cn(
          'flex min-w-0 max-w-[90%] flex-col gap-1 rounded-md border p-3 text-sm sm:max-w-[80%]',
          fromRequester ? 'bg-card' : 'bg-muted',
        )}
      >
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{message.author.name}</span>
          {' · '}
          <span title={formatAbsoluteInstant(message.sentAt)}>{formatTimeAgo(message.sentAt)}</span>
        </p>
        <p
          id={bodyId}
          className={cn(
            'break-words whitespace-pre-wrap',
            !expanded && truncatable && 'line-clamp-6',
          )}
          data-testid="message-bubble-body"
        >
          {message.body}
        </p>
        {truncatable && (
          <Button
            type="button"
            variant="link"
            size="xs"
            className="self-start px-0"
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => setExpanded((current) => !current)}
            data-testid="message-bubble-toggle-button"
          >
            {expanded ? 'Ver menos' : 'Ver mais'}
          </Button>
        )}
      </article>
    </li>
  );
}
