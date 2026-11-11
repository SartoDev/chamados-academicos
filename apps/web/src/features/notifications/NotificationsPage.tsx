import { useNavigate } from 'react-router';
import type { TicketNotification } from '@/app/api/types';
import { listStatusOf } from '@/app/components/list-status';
import { ListState } from '@/app/components/ListState';
import { PaginationControls } from '@/app/components/PaginationControls';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useListParams } from '@/features/tickets/use-list-params';
import { NotificationList } from './NotificationList';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from './notifications-api';

const DEFAULTS = { page: '1', unreadOnly: 'false' };

/** "Ver todas": the full list, with the unread filter kept in the address (BR6.4). */
export function NotificationsPage() {
  const navigate = useNavigate();
  const { values, page, update, setPage } = useListParams(DEFAULTS);
  const unreadOnly = values.unreadOnly === 'true';
  const notifications = useNotifications({ page, unreadOnly });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const openTicket = async (notification: TicketNotification) => {
    if (!notification.read) {
      try {
        await markRead.mutateAsync(notification.id);
      } catch {
        // The ticket opens anyway; the counter refreshes on its own.
      }
    }
    navigate(`/tickets/${notification.ticket.id}`);
  };

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Notificações</h1>
        <Button
          variant="outline"
          disabled={markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
          data-testid="notifications-page-mark-all-button"
        >
          Marcar todas como lidas
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="notifications-unread-filter"
          type="checkbox"
          checked={unreadOnly}
          onChange={(event) => update({ unreadOnly: String(event.target.checked) })}
          data-testid="notifications-page-unread-filter"
        />
        <Label htmlFor="notifications-unread-filter">Somente não lidas</Label>
      </div>

      <ListState
        status={listStatusOf(notifications)}
        emptyMessage={unreadOnly ? 'Nenhuma notificação não lida.' : 'Nenhuma notificação.'}
        errorMessage={`Não foi possível carregar suas notificações. ${messageForError(notifications.error)}`}
        onRetry={() => void notifications.refetch()}
      >
        {notifications.data && (
          <>
            <NotificationList
              items={notifications.data.items}
              testIdPrefix="notifications-page"
              onOpen={(notification) => void openTicket(notification)}
            />
            <PaginationControls
              page={notifications.data.page}
              pageSize={notifications.data.pageSize}
              total={notifications.data.total}
              onPageChange={setPage}
              testIdPrefix="notifications-page"
            />
          </>
        )}
      </ListState>
    </section>
  );
}
