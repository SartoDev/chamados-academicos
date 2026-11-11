import { useNavigate } from 'react-router';
import type { TicketNotification } from '@/app/api/types';
import { listStatusOf } from '@/app/components/list-status';
import { ListState } from '@/app/components/ListState';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotificationList } from './NotificationList';
import {
  PANEL_PAGE_SIZE,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from './notifications-api';

/**
 * Tela 7: the panel of the bell. It is a dialog, so the focus stays inside and Escape gives it
 * back to the bell (BR9.6). Clicking a notification marks it as read and opens the ticket.
 */
export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const notifications = useNotifications({ page: 1, pageSize: PANEL_PAGE_SIZE }, open);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const openTicket = async (notification: TicketNotification) => {
    if (!notification.read) {
      try {
        await markRead.mutateAsync(notification.id);
      } catch {
        // Opening the ticket matters more than the mark; the counter refreshes on its own.
      }
    }
    onClose();
    navigate(`/tickets/${notification.ticket.id}`);
  };

  return (
    <DialogContent data-testid="notifications-panel">
      <DialogHeader>
        <DialogTitle>Notificações</DialogTitle>
        <DialogDescription>Avisos do que mudou nos seus chamados.</DialogDescription>
      </DialogHeader>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
          data-testid="notifications-panel-mark-all-button"
        >
          Marcar todas como lidas
        </Button>
      </div>

      <ListState
        status={listStatusOf(notifications)}
        emptyMessage="Nenhuma notificação."
        errorMessage={`Não foi possível carregar suas notificações. ${messageForError(notifications.error)}`}
        onRetry={() => void notifications.refetch()}
        skeletonRows={3}
      >
        {notifications.data && (
          <NotificationList
            items={notifications.data.items}
            testIdPrefix="notifications-panel"
            onOpen={(notification) => void openTicket(notification)}
          />
        )}
      </ListState>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onClose();
          navigate('/notifications');
        }}
        data-testid="notifications-panel-see-all-button"
      >
        Ver todas
      </Button>
    </DialogContent>
  );
}
