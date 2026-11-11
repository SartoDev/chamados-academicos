import type {
  Rating,
  SectorRef,
  TicketDetail,
  TicketHistoryEntry,
  TicketListItem,
  TicketNotification,
  TicketSectorPassage,
  UserRef,
} from '@/app/api/types';
import { errorBody, type MockHandler } from './api-mock';
import { documentos, page, priorities, secretaria, statuses } from './fixtures';

const TIMESTAMP = '2026-09-10T12:00:00.000Z';

export const financeiro: SectorRef = { id: 'sector-financeiro', name: 'Financeiro' };

export const studentRef: UserRef = { id: 'user-student', name: 'Ana Souza' };
export const agentRef: UserRef = { id: 'user-agent', name: 'Atendente Débora' };
export const otherAgentRef: UserRef = { id: 'user-other-agent', name: 'Atendente Elias' };
export const managerRef: UserRef = { id: 'user-manager', name: 'Gestora Fernanda' };

const statusByKey = (key: string) => {
  const status = statuses.find((candidate) => candidate.key === key) ?? statuses[0];
  return { id: status.id, key: status.key, label: status.label };
};

export function makeTicket(overrides: Partial<TicketListItem> = {}): TicketListItem {
  return {
    id: 'ticket-42',
    reference: '#42',
    title: 'Revisão de nota',
    category: { id: documentos.id, name: documentos.name },
    sector: { id: secretaria.id, name: secretaria.name },
    status: statusByKey('OPEN'),
    priority: { id: priorities[1].id, label: priorities[1].label },
    requester: studentRef,
    assignee: null,
    assigneeUnavailable: false,
    openedAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

export function makeTicketDetail(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    ...makeTicket(),
    description: 'Gostaria de solicitar a revisão da nota da P2.',
    closedAt: null,
    ...overrides,
  };
}

/** A ticket in analysis, assigned to the agent: the usual state of a ticket being handled. */
export function makeTicketInAnalysis(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return makeTicketDetail({
    status: statusByKey('IN_ANALYSIS'),
    assignee: agentRef,
    ...overrides,
  });
}

export function makeClosedTicket(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return makeTicketDetail({
    status: statusByKey('CLOSED'),
    assignee: agentRef,
    closedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    ...overrides,
  });
}

export function makeHistoryEntry(overrides: Partial<TicketHistoryEntry> = {}): TicketHistoryEntry {
  return {
    id: 'history-1',
    field: 'STATUS',
    previousValue: 'Aberto',
    newValue: 'Em análise',
    justification: null,
    author: agentRef,
    occurredAt: TIMESTAMP,
    ...overrides,
  };
}

export function makePassage(overrides: Partial<TicketSectorPassage> = {}): TicketSectorPassage {
  return {
    id: 'passage-1',
    sector: { id: secretaria.id, name: secretaria.name },
    enteredAt: TIMESTAMP,
    leftAt: null,
    justification: null,
    transferredBy: null,
    ...overrides,
  };
}

export function makeNotification(overrides: Partial<TicketNotification> = {}): TicketNotification {
  return {
    id: 'notification-1',
    kind: 'STATUS_CHANGED',
    ticket: { id: 'ticket-42', reference: '#42', title: 'Revisão de nota' },
    read: false,
    createdAt: TIMESTAMP,
    readAt: null,
    ...overrides,
  };
}

export function makeRating(overrides: Partial<Rating> = {}): Rating {
  return {
    ticketId: 'ticket-42',
    score: 4,
    comment: 'Atendimento rápido e cordial.',
    ratedAt: TIMESTAMP,
    ...overrides,
  };
}

/**
 * Catalog answers every ticket screen needs, plus the quiet notification bell and the rating of
 * the fixture ticket, which U5 asks for from inside the Detalhes tab. The default answer is "not
 * rated yet", so every screen that does not care about the rating behaves as it did before.
 */
export const ticketOptionRoutes: Record<string, MockHandler> = {
  'GET /tickets/ticket-42/rating': { status: 404, body: errorBody('RATING_NOT_FOUND') },
  'GET /statuses': { body: page(statuses) },
  'GET /categories': { body: page([documentos]) },
  'GET /sectors': {
    body: page([
      secretaria,
      { ...financeiro, active: true, createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
    ]),
  },
  'GET /priorities': { body: page(priorities) },
  'GET /notifications/unread-count': { body: { count: 0 } },
  'GET /notifications': { body: page([]) },
};
