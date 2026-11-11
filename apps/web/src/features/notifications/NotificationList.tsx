import type { TicketNotification } from '@/app/api/types';
import { formatAbsoluteInstant, formatTimeAgo } from '@/features/tickets/relative-time';
import { NOTIFICATION_KIND_LABELS } from './notification-text';

interface NotificationListProps {
  items: readonly TicketNotification[];
  testIdPrefix: string;
  /** Opens the ticket of the notification and marks it as read (AC1.5.3). */
  onOpen: (notification: TicketNotification) => void;
}

/** Unread is written in text, never colour alone (AC5.3.4, BR9.6). */
export function NotificationList({ items, testIdPrefix, onOpen }: NotificationListProps) {
  return (
    <ul className="flex flex-col gap-2" data-testid={`${testIdPrefix}-list`}>
      {items.map((notification) => (
        <li key={notification.id}>
          <button
            type="button"
            onClick={() => onOpen(notification)}
            className="flex w-full flex-col items-start gap-1 rounded-md border p-3 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            data-testid={`${testIdPrefix}-item-${notification.id}`}
          >
            <span className="flex w-full flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                {notification.ticket.reference} {notification.ticket.title}
              </span>
              <span
                className="text-xs text-muted-foreground"
                title={formatAbsoluteInstant(notification.createdAt)}
              >
                {formatTimeAgo(notification.createdAt)}
              </span>
            </span>
            <span>{NOTIFICATION_KIND_LABELS[notification.kind]}</span>
            {!notification.read && (
              <span className="text-xs font-medium" data-testid={`${testIdPrefix}-unread-mark`}>
                não lida
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
