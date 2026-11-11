import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/app/api/api-client';
import type { Message, MessageOrder, MessagePage } from '@/app/api/types';
import { ticketKeys } from '@/features/tickets/tickets-api';

/** BR5.4: the tab opens on the 50 most recent messages and loads older ones on demand. */
export const MESSAGES_PAGE_SIZE = 50;

/** The tab always asks for the newest page first and reverses it for display (BR3.2, BR5.4). */
export const MESSAGES_ORDER: MessageOrder = 'desc';

/** Prefix of the notification queries: a sent message may add a notice to the bell (BR4.3). */
const NOTIFICATIONS_KEY = ['notifications'] as const;

export const conversationKeys = {
  all: ['conversation'] as const,
  messages: (ticketId: string) => ['conversation', 'messages', ticketId] as const,
};

export const messagesPath = (ticketId: string) =>
  `/tickets/${encodeURIComponent(ticketId)}/messages`;

export function hasMorePages(page: MessagePage): boolean {
  return page.page * page.pageSize < page.total;
}

/**
 * Joins the loaded pages into one chronological list, discarding repeated identifiers.
 *
 * `listMessages` paginates by offset (X-01), so a message stored between two page requests
 * shifts the window. Because a message is never edited nor deleted (BR2.3) and a new one always
 * enters at the start of the descending order, a shifted window can only repeat a message that
 * is already loaded — it can never hide one. Dropping repeated identifiers here is therefore
 * enough to make the shift invisible, and no message is lost (review finding R-06).
 */
export function mergeMessagePages(pages: readonly MessagePage[]): Message[] {
  const byId = new Map<string, Message>();
  for (const page of pages) {
    for (const message of page.items) {
      if (!byId.has(message.id)) {
        byId.set(message.id, message);
      }
    }
  }
  return [...byId.values()].sort((left, right) => {
    const difference = Date.parse(left.sentAt) - Date.parse(right.sentAt);
    // Same instant: the identifier breaks the tie, the same way the server orders (BR3.1).
    return difference !== 0 ? difference : left.id.localeCompare(right.id);
  });
}

/**
 * The conversation of a ticket, newest page first. Loading starts only when the tab is open,
 * and the first 404 tells the caller the actor may not read this conversation (BR1.2, BR5.1).
 */
export function useConversation(ticketId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: conversationKeys.messages(ticketId),
    queryFn: ({ pageParam }) =>
      apiRequest<MessagePage>(messagesPath(ticketId), {
        query: { page: pageParam, pageSize: MESSAGES_PAGE_SIZE, order: MESSAGES_ORDER },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: MessagePage) =>
      hasMorePages(lastPage) ? lastPage.page + 1 : undefined,
    enabled,
  });
}

/**
 * Sends a message (X-01: mutations never retry). Success and failure both refresh the
 * conversation, the ticket and the bell: the requester's message may have moved the ticket back
 * to analysis (BR4.2), and a refusal means the screen was stale.
 */
export function useSendMessage(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiRequest<Message>(messagesPath(ticketId), { method: 'POST', body: { body } }),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationKeys.messages(ticketId) }),
        queryClient.invalidateQueries({ queryKey: ticketKeys.all }),
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
      ]);
    },
  });
}
