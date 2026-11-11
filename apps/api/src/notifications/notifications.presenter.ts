import { formatTicketReference } from '../tickets/rules/ticket-reference.js';
import type { NotificationKindValue } from './rules/notification-recipients.js';
import type { NotificationView } from './notifications.types.js';

/** Number and title of the ticket come from the relation between tables of U2 (DB-01). */
export const NOTIFICATION_TICKET_SELECT = {
  select: { id: true, number: true, title: true },
} as const;

export interface NotificationRow {
  id: string;
  kind: NotificationKindValue;
  read: boolean;
  createdAt: Date;
  readAt: Date | null;
  ticket: { id: string; number: number; title: string };
}

export function toNotificationView(row: NotificationRow): NotificationView {
  return {
    id: row.id,
    kind: row.kind,
    ticket: {
      id: row.ticket.id,
      reference: formatTicketReference(row.ticket.number),
      title: row.ticket.title,
    },
    read: row.read,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  };
}
