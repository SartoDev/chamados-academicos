import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/app/api/api-client';
import type { Rating, RatingSummary } from '@/app/api/types';
import type { ReportPeriod } from '@/features/reports/reports-api';

export const ratingKeys = {
  all: ['rating'] as const,
  ticket: (ticketId: string) => ['rating', 'ticket', ticketId] as const,
  summary: (period: ReportPeriod) => ['rating', 'summary', period] as const,
};

export const ratingPath = (ticketId: string) => `/tickets/${encodeURIComponent(ticketId)}/rating`;

export interface RateTicketInput {
  score: number;
  comment?: string;
}

/**
 * The rating of a ticket, or `null` when the ticket is visible and still unrated (BR1.3). The
 * 404 `RATING_NOT_FOUND` is a state of the screen, not an error of it, so it is turned into an
 * absent rating; every other failure keeps travelling as an error (frontend-components.md).
 */
export function useTicketRating(ticketId: string, enabled = true) {
  return useQuery({
    queryKey: ratingKeys.ticket(ticketId),
    queryFn: async (): Promise<Rating | null> => {
      try {
        return await apiRequest<Rating>(ratingPath(ticketId));
      } catch (error) {
        if (error instanceof ApiError && error.code === 'RATING_NOT_FOUND') {
          return null;
        }
        throw error;
      }
    },
    enabled,
  });
}

/**
 * Stores the rating (X-01: mutations never retry). Success and failure both refresh the rating
 * of the ticket: a 409 means the screen was stale and a rating already exists (BR2.3).
 */
export function useRateTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RateTicketInput) =>
      apiRequest<Rating>(ratingPath(ticketId), { method: 'PUT', body: input }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ratingKeys.ticket(ticketId) });
    },
  });
}

/** Average and count of the period, cut by the closing of the ticket like the times (BR3.1). */
export function useRatingSummary(period: ReportPeriod) {
  return useQuery({
    queryKey: ratingKeys.summary(period),
    queryFn: () =>
      apiRequest<RatingSummary>('/reports/ratings', {
        query: { from: period.from, to: period.to },
      }),
  });
}
