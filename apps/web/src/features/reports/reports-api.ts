import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/app/api/api-client';
import type {
  DurationAverages,
  Page,
  ReportGroupBy,
  ReportTicket,
  TicketCounts,
} from '@/app/api/types';

export const REPORT_PAGE_SIZE = 20;

/** Closed at the start and open at the end, in UTC (BR2.1). Both bounds always travel. */
export interface ReportPeriod {
  from: string;
  to: string;
}

export interface ReportTicketListParams {
  period: ReportPeriod;
  page: number;
  statusId?: string;
  categoryId?: string;
  sectorId?: string;
}

export const reportKeys = {
  all: ['reports'] as const,
  counts: (groupBy: ReportGroupBy, period: ReportPeriod) =>
    ['reports', 'counts', groupBy, period] as const,
  durations: (period: ReportPeriod) => ['reports', 'durations', period] as const,
  tickets: (params: ReportTicketListParams) => ['reports', 'tickets', params] as const,
};

/**
 * Counts grouped by status, category or sector, cut by the opening of the ticket (BR3.1).
 * `enabled` is false for the grouping the current profile does not display (BR7.1, Q4).
 */
export function useTicketCounts(groupBy: ReportGroupBy, period: ReportPeriod, enabled = true) {
  return useQuery({
    queryKey: reportKeys.counts(groupBy, period),
    queryFn: () =>
      apiRequest<TicketCounts>('/reports/ticket-counts', {
        query: { groupBy, from: period.from, to: period.to },
      }),
    enabled,
  });
}

/** Average handling and resolution times of the period, cut by the closing (BR4.3). */
export function useDurationAverages(period: ReportPeriod) {
  return useQuery({
    queryKey: reportKeys.durations(period),
    queryFn: () =>
      apiRequest<DurationAverages>('/reports/durations', {
        query: { from: period.from, to: period.to },
      }),
  });
}

/** Filtered, paginated listing of the manager, cut by the opening of the ticket (BR5.1). */
export function useReportTickets(params: ReportTicketListParams) {
  return useQuery({
    queryKey: reportKeys.tickets(params),
    queryFn: () =>
      apiRequest<Page<ReportTicket>>('/reports/tickets', {
        query: {
          page: params.page,
          pageSize: REPORT_PAGE_SIZE,
          statusId: params.statusId,
          categoryId: params.categoryId,
          sectorId: params.sectorId,
          from: params.period.from,
          to: params.period.to,
        },
      }),
    placeholderData: keepPreviousData,
  });
}
