import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/app/api/api-client';
import type { Page, TicketNotification, UnreadNotificationCount } from '@/app/api/types';

export const NOTIFICATIONS_PAGE_SIZE = 20;
/** The panel shows only the most recent notifications; "Ver todas" opens the full page. */
export const PANEL_PAGE_SIZE = 10;

export interface NotificationListParams {
  page: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: NotificationListParams) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

/** The actor's own notifications, newest first (BR6.4). */
export function useNotifications(params: NotificationListParams, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () =>
      apiRequest<Page<TicketNotification>>('/notifications', {
        query: {
          page: params.page,
          pageSize: params.pageSize ?? NOTIFICATIONS_PAGE_SIZE,
          unreadOnly: params.unreadOnly || undefined,
        },
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Unread counter of the bell; refreshed when the app opens and after the user's own actions. */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => apiRequest<UnreadNotificationCount>('/notifications/unread-count'),
  });
}

function useNotificationMutation<TInput>(mutationFn: (input: TInput) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkNotificationRead() {
  return useNotificationMutation((notificationId: string) =>
    apiRequest<void>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'POST',
    }),
  );
}

export function useMarkAllNotificationsRead() {
  return useNotificationMutation((_: void) =>
    apiRequest<void>('/notifications/read-all', { method: 'POST' }),
  );
}
