import type {
  DurationAverages,
  RatingSummary,
  ReportTicket,
  TicketCountGroup,
  TicketCounts,
} from '@/app/api/types';
import type { MockHandler, RecordedRequest } from './api-mock';
import { documentos, page, priorities, secretaria, statuses } from './fixtures';
import { financeiro, ticketOptionRoutes } from './ticket-fixtures';

const TIMESTAMP = '2026-09-10T12:00:00.000Z';

export function makeCounts(
  groups: TicketCountGroup[],
  overrides: Partial<TicketCounts> = {},
): TicketCounts {
  return {
    groups,
    total: groups.reduce((sum, group) => sum + group.count, 0),
    from: '2026-08-12T00:00:00.000Z',
    to: '2026-09-11T00:00:00.000Z',
    ...overrides,
  };
}

/** Two statuses answer counts and two are missing, so the zero fill of BR7.1 is observable. */
export const statusCounts = makeCounts([
  { id: 'status-open', label: 'Aberto', count: 3 },
  { id: 'status-closed', label: 'Encerrado', count: 2 },
]);

export const categoryCounts = makeCounts([{ id: documentos.id, label: documentos.name, count: 5 }]);

export const sectorCounts = makeCounts([
  { id: secretaria.id, label: secretaria.name, count: 4 },
  { id: financeiro.id, label: financeiro.name, count: 1 },
]);

/** One day and two hours of resolution, one hour and a half of handling, different samples. */
export function makeDurations(overrides: Partial<DurationAverages> = {}): DurationAverages {
  return {
    averageResolutionSeconds: 93_600,
    resolutionSampleSize: 4,
    averageHandlingSeconds: 5400,
    handlingSampleSize: 2,
    from: '2026-08-12T00:00:00.000Z',
    to: '2026-09-11T00:00:00.000Z',
    ...overrides,
  };
}

/** Average 4.2 over five ratings: a value with one decimal place and a sample of its own. */
export function makeRatingSummary(overrides: Partial<RatingSummary> = {}): RatingSummary {
  return {
    averageScore: 4.2,
    count: 5,
    from: '2026-08-12T00:00:00.000Z',
    to: '2026-09-11T00:00:00.000Z',
    ...overrides,
  };
}

export function makeReportTicket(overrides: Partial<ReportTicket> = {}): ReportTicket {
  return {
    id: 'ticket-42',
    reference: '#42',
    title: 'Revisão de nota',
    category: { id: documentos.id, name: documentos.name },
    sector: { id: secretaria.id, name: secretaria.name },
    status: { id: 'status-open', name: 'Aberto' },
    priority: { id: priorities[1].id, name: priorities[1].label },
    assignee: null,
    openedAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

function countsByGroup(request: RecordedRequest) {
  switch (request.query.get('groupBy')) {
    case 'category':
      return { body: categoryCounts };
    case 'sector':
      return { body: sectorCounts };
    default:
      return { body: statusCounts };
  }
}

/** Every answer the panel needs, plus the catalog of U1 and the quiet notification bell. */
export const reportRoutes: Record<string, MockHandler> = {
  ...ticketOptionRoutes,
  'GET /statuses': { body: page(statuses) },
  'GET /reports/ticket-counts': countsByGroup,
  'GET /reports/durations': { body: makeDurations() },
  'GET /reports/ratings': { body: makeRatingSummary() },
  'GET /reports/tickets': { body: page([makeReportTicket()]) },
};
