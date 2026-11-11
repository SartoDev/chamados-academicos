import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { apiRequest } from '@/app/api/api-client';
import type {
  AssignableUsers,
  Category,
  Page,
  Priority,
  QueueSlice,
  Sector,
  SortOrder,
  Status,
  TicketDetail,
  TicketHistoryEntry,
  TicketListItem,
  TicketListView,
  TicketSectorPassage,
  TicketSortField,
} from '@/app/api/types';

export const TICKETS_PAGE_SIZE = 20;
/** Size used to fill selection lists and the history tab (maximum allowed by X-01). */
export const OPTIONS_PAGE_SIZE = 100;

export interface TicketListParams {
  view: TicketListView;
  queue?: QueueSlice;
  page: number;
  statusId?: string;
  categoryId?: string;
  sectorId?: string;
  sort?: TicketSortField;
  order?: SortOrder;
}

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (params: TicketListParams) => ['tickets', 'list', params] as const,
  detail: (ticketId: string) => ['tickets', 'detail', ticketId] as const,
  history: (ticketId: string, page: number) => ['tickets', 'history', ticketId, page] as const,
  passages: (ticketId: string) => ['tickets', 'passages', ticketId] as const,
  assignable: (ticketId: string) => ['tickets', 'assignable', ticketId] as const,
};

export const ticketOptionKeys = {
  availableCategories: ['ticket-options', 'available-categories'] as const,
  categories: ['ticket-options', 'categories'] as const,
  activePriorities: ['ticket-options', 'active-priorities'] as const,
  activeSectors: ['ticket-options', 'active-sectors'] as const,
  sectors: ['ticket-options', 'sectors'] as const,
  statuses: ['ticket-options', 'statuses'] as const,
};

/** Prefix of the notification queries: ticket actions refresh the bell (frontend-components). */
const NOTIFICATIONS_KEY: QueryKey = ['notifications'];

export const ticketPath = (ticketId: string, suffix = '') =>
  `/tickets/${encodeURIComponent(ticketId)}${suffix}`;

export function useTickets(params: TicketListParams) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () =>
      apiRequest<Page<TicketListItem>>('/tickets', {
        query: {
          view: params.view,
          queue: params.queue,
          page: params.page,
          pageSize: TICKETS_PAGE_SIZE,
          statusId: params.statusId,
          categoryId: params.categoryId,
          sectorId: params.sectorId,
          sort: params.sort,
          order: params.order,
        },
      }),
    placeholderData: keepPreviousData,
  });
}

export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => apiRequest<TicketDetail>(ticketPath(ticketId)),
  });
}

export function useTicketHistory(ticketId: string, page = 1) {
  return useQuery({
    queryKey: ticketKeys.history(ticketId, page),
    queryFn: () =>
      apiRequest<Page<TicketHistoryEntry>>(ticketPath(ticketId, '/history'), {
        query: { page, pageSize: OPTIONS_PAGE_SIZE },
      }),
  });
}

export function useTicketPassages(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.passages(ticketId),
    queryFn: () =>
      apiRequest<Page<TicketSectorPassage>>(ticketPath(ticketId, '/sector-passages'), {
        query: { page: 1, pageSize: OPTIONS_PAGE_SIZE },
      }),
  });
}

export function useAssignableUsers(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.assignable(ticketId),
    queryFn: () => apiRequest<AssignableUsers>(ticketPath(ticketId, '/assignable-users')),
  });
}

/** Categories offered for new tickets: category and sector active (BR1.3, AC1.2.6, AC4.2.3). */
export function useAvailableCategories() {
  return useQuery({
    queryKey: ticketOptionKeys.availableCategories,
    queryFn: () =>
      apiRequest<Page<Category>>('/categories', {
        query: { available: true, pageSize: OPTIONS_PAGE_SIZE },
      }),
  });
}

/** Every category, active or not, to filter existing tickets (BR5.3). */
export function useCategoryOptions() {
  return useQuery({
    queryKey: ticketOptionKeys.categories,
    queryFn: () =>
      apiRequest<Page<Category>>('/categories', { query: { pageSize: OPTIONS_PAGE_SIZE } }),
  });
}

export function useActivePriorities() {
  return useQuery({
    queryKey: ticketOptionKeys.activePriorities,
    queryFn: () =>
      apiRequest<Page<Priority>>('/priorities', {
        query: { active: true, pageSize: OPTIONS_PAGE_SIZE },
      }),
  });
}

export function useActiveSectors() {
  return useQuery({
    queryKey: ticketOptionKeys.activeSectors,
    queryFn: () =>
      apiRequest<Page<Sector>>('/sectors', {
        query: { active: true, pageSize: OPTIONS_PAGE_SIZE },
      }),
  });
}

/** Every sector, active or not, to filter existing tickets (BR5.3). */
export function useSectorOptions() {
  return useQuery({
    queryKey: ticketOptionKeys.sectors,
    queryFn: () => apiRequest<Page<Sector>>('/sectors', { query: { pageSize: OPTIONS_PAGE_SIZE } }),
  });
}

export function useStatusOptions() {
  return useQuery({
    queryKey: ticketOptionKeys.statuses,
    queryFn: () => apiRequest<Page<Status>>('/statuses'),
  });
}

/**
 * Mutations never retry (X-01). Success and failure both refresh the ticket queries: a 403 or
 * 409 means the screen was stale, so the detail, the lists and the actions are reloaded.
 */
function useTicketMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ticketKeys.all }),
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
      ]);
    },
  });
}

export interface OpenTicketInput {
  categoryId: string;
  title: string;
  description: string;
  priorityId?: string;
}

export function useOpenTicket() {
  return useTicketMutation((input: OpenTicketInput) =>
    apiRequest<TicketDetail>('/tickets', { method: 'POST', body: input }),
  );
}

/** Actions without a body that move the ticket along the transitions of BR4.1. */
export type TicketStatusAction = 'assume' | 'wait-for-requester' | 'close' | 'reopen';

export function useTicketStatusAction() {
  return useTicketMutation(
    ({ ticketId, action }: { ticketId: string; action: TicketStatusAction }) =>
      apiRequest<TicketDetail>(ticketPath(ticketId, `/${action}`), { method: 'POST' }),
  );
}

export interface TransferTicketInput {
  ticketId: string;
  targetSectorId: string;
  justification: string;
}

export function useTransferTicket() {
  return useTicketMutation(({ ticketId, targetSectorId, justification }: TransferTicketInput) =>
    apiRequest<TicketDetail>(ticketPath(ticketId, '/transfer'), {
      method: 'POST',
      body: { targetSectorId, justification },
    }),
  );
}

export function useAssignTicket() {
  return useTicketMutation(({ ticketId, assigneeId }: { ticketId: string; assigneeId: string }) =>
    apiRequest<TicketDetail>(ticketPath(ticketId, '/assign'), {
      method: 'POST',
      body: { assigneeId },
    }),
  );
}

export function useChangeTicketPriority() {
  return useTicketMutation(({ ticketId, priorityId }: { ticketId: string; priorityId: string }) =>
    apiRequest<TicketDetail>(ticketPath(ticketId, '/priority'), {
      method: 'PUT',
      body: { priorityId },
    }),
  );
}
