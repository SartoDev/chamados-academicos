import { Injectable } from '@nestjs/common';
import { Clock } from '../common/clock.js';
import { DomainError } from '../common/errors/domain-error.js';
import { TransactionRunner } from '../common/prisma/transaction-runner.js';
import { uniqueUuids } from '../common/uuid.js';
import { isNotificationKind } from './rules/notification-recipients.js';
import type { RecordNotificationInput } from './notifications.types.js';

/**
 * SVC-03 public service of Notifications (BR8.4). One notice per distinct recipient; the caller
 * has already removed the actor (BR6.2). The write joins the ambient transaction of the change
 * that caused it, so a rolled back change never leaves a notification behind (BR6.3).
 */
@Injectable()
export class NotificationsPublicService {
  constructor(
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  async record(input: RecordNotificationInput): Promise<void> {
    if (!isNotificationKind(input.kind)) {
      // Only reachable from a programming error in a calling unit, never from user input.
      throw new DomainError('INTERNAL_ERROR', `Unknown notification kind: ${input.kind}`);
    }
    const kind = input.kind;
    const recipientIds = uniqueUuids(input.recipientIds);
    if (recipientIds.length === 0) {
      return;
    }
    const createdAt = this.clock.now();
    await this.transactions.run(async () => {
      await this.transactions.db().notification.createMany({
        data: recipientIds.map((recipientId) => ({
          recipientId,
          ticketId: input.ticketId,
          kind,
          createdAt,
        })),
      });
    });
  }
}
