import { Bell } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { NotificationsPanel } from './NotificationsPanel';
import { useUnreadNotificationCount } from './notifications-api';

/** BR9.6: the counter has an accessible label and the panel opens from the bell (AC1.5.2). */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unread = useUnreadNotificationCount();
  const count = unread.data?.count ?? 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            count > 0
              ? `Notificações: ${count} não ${count === 1 ? 'lida' : 'lidas'}`
              : 'Notificações: nenhuma não lida'
          }
          data-testid="notification-bell-button"
        >
          <Bell aria-hidden />
          {count > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full border bg-background px-1 text-[10px] leading-4 font-medium"
              data-testid="notification-bell-count"
            >
              {count}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <NotificationsPanel open={open} onClose={() => setOpen(false)} />
    </Dialog>
  );
}
