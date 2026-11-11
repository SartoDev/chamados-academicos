import { Injectable } from '@nestjs/common';
import type { Actor } from '../auth/actor.js';
import { Clock } from '../common/clock.js';
import { DomainError } from '../common/errors/domain-error.js';
import { toSkipTake, type Page, type PageRequest } from '../common/pagination.js';
import { TransactionRunner, type DatabaseClient } from '../common/prisma/transaction-runner.js';
import { isUuid } from '../common/uuid.js';
import { NOTIFICATION_TICKET_SELECT, toNotificationView } from './notifications.presenter.js';
import type {
  NotificationListFilter,
  NotificationView,
  UnreadCountView,
} from './notifications.types.js';

function notificationNotFound(): DomainError {
  return new DomainError('NOTIFICATION_NOT_FOUND', 'Notification not found');
}

/**
 * Notifications of the signed-in actor (WF11, BR6.4). Every query carries the recipient inside
 * it, so a notification of somebody else is simply not found.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  private get db(): DatabaseClient {
    return this.transactions.db();
  }

  /** Newest first, with the optional unread filter (BR6.4). */
  async list(
    actor: Actor,
    filter: NotificationListFilter,
    page: PageRequest,
  ): Promise<Page<NotificationView>> {
    const where = { recipientId: actor.id, ...(filter.unreadOnly ? { read: false } : {}) };
    const [total, rows] = await Promise.all([
      this.db.notification.count({ where }),
      this.db.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { ticket: NOTIFICATION_TICKET_SELECT },
        ...toSkipTake(page),
      }),
    ]);
    return {
      items: rows.map(toNotificationView),
      total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  async countUnread(actor: Actor): Promise<UnreadCountView> {
    const count = await this.db.notification.count({
      where: { recipientId: actor.id, read: false },
    });
    return { count };
  }

  /** Idempotent: marking an already read notification again succeeds and changes nothing. */
  async markRead(actor: Actor, notificationId: string): Promise<void> {
    if (!isUuid(notificationId)) {
      throw notificationNotFound();
    }
    await this.transactions.run(async () => {
      const marked = await this.db.notification.updateMany({
        where: { id: notificationId, recipientId: actor.id, read: false },
        data: { read: true, readAt: this.clock.now() },
      });
      if (marked.count > 0) {
        return;
      }
      const alreadyRead = await this.db.notification.findFirst({
        where: { id: notificationId, recipientId: actor.id },
        select: { id: true },
      });
      if (!alreadyRead) {
        throw notificationNotFound();
      }
    });
  }

  /** Affects only the unread notifications of the actor; the counter then reads zero. */
  async markAllRead(actor: Actor): Promise<void> {
    await this.transactions.run(async () => {
      await this.db.notification.updateMany({
        where: { recipientId: actor.id, read: false },
        data: { read: true, readAt: this.clock.now() },
      });
    });
  }
}
