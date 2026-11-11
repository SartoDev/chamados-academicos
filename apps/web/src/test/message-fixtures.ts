import type { CurrentUser, Message, MessagePage, TicketDetail } from '@/app/api/types';
import { mockApi, type MockHandler } from './api-mock';
import { page } from './fixtures';
import { renderApp } from './render';
import { agentRef, studentRef } from './ticket-fixtures';

const CONVERSATION_START = Date.parse('2026-09-10T12:00:00.000Z');
export const ONE_MINUTE_MS = 60_000;

export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'message-1',
    body: 'Bom dia, alguma novidade?',
    author: studentRef,
    sentAt: new Date(CONVERSATION_START).toISOString(),
    ...overrides,
  };
}

export function makeAgentMessage(overrides: Partial<Message> = {}): Message {
  return makeMessage({
    id: 'message-agent-1',
    body: 'Estou verificando com a coordenação.',
    author: agentRef,
    sentAt: new Date(CONVERSATION_START + ONE_MINUTE_MS).toISOString(),
    ...overrides,
  });
}

/** `count` messages one minute apart, oldest first, as the API stores them. */
export function makeConversation(count: number, startAt = CONVERSATION_START): Message[] {
  return Array.from({ length: count }, (_, index) =>
    makeMessage({
      id: `message-${index + 1}`,
      body: `Mensagem ${index + 1}.`,
      sentAt: new Date(startAt + index * ONE_MINUTE_MS).toISOString(),
    }),
  );
}

/** One page of `listMessages` as the tab asks for it: most recent first (`order=desc`). */
export function messagePage(
  chronological: readonly Message[],
  page = 1,
  pageSize = 50,
  total = chronological.length,
): MessagePage {
  const newestFirst = [...chronological].reverse();
  const start = (page - 1) * pageSize;
  return { items: newestFirst.slice(start, start + pageSize), total, page, pageSize };
}

/** The ticket detail with the quiet catalog and bell answers every conversation test needs. */
export function renderConversationDetail(
  user: CurrentUser,
  ticket: TicketDetail,
  routes: Record<string, MockHandler> = {},
) {
  const api = mockApi({
    'GET /auth/me': { body: user },
    'GET /statuses': { body: page([]) },
    'GET /categories': { body: page([]) },
    'GET /sectors': { body: page([]) },
    'GET /priorities': { body: page([]) },
    'GET /notifications/unread-count': { body: { count: 0 } },
    'GET /notifications': { body: page([]) },
    [`GET /tickets/${ticket.id}`]: { body: ticket },
    [`GET /tickets/${ticket.id}/history`]: { body: page([]) },
    [`GET /tickets/${ticket.id}/sector-passages`]: { body: page([]) },
    ...routes,
  });
  return { api, ...renderApp(`/tickets/${ticket.id}`) };
}
