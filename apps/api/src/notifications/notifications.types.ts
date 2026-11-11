import type { NotificationKindValue } from './rules/notification-recipients.js';

/** Response shapes of the notification operations of API-U2. */
export interface NotificationTicketRefView {
  id: string;
  reference: string;
  title: string;
}

export interface NotificationView {
  id: string;
  kind: NotificationKindValue;
  ticket: NotificationTicketRefView;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationListFilter {
  unreadOnly?: boolean;
}

export interface UnreadCountView {
  count: number;
}

/** SVC-03 `NotificationsPublicService.record` (BR8.4). `kind` is text in the contract. */
export interface RecordNotificationInput {
  kind: string;
  ticketId: string;
  recipientIds: string[];
}
