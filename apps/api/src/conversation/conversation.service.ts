import { Injectable } from '@nestjs/common';
import type { Actor } from '../auth/actor.js';
import { Clock } from '../common/clock.js';
import { toSkipTake, type Page, type PageRequest } from '../common/pagination.js';
import { TransactionRunner, type DatabaseClient } from '../common/prisma/transaction-runner.js';
import { uniqueUuids } from '../common/uuid.js';
import { NotificationsPublicService } from '../notifications/notifications-public.service.js';
import { TicketsPublicService } from '../tickets/tickets-public.service.js';
import { UsersPublicService } from '../users/users-public.service.js';
import {
  conversationNotFound,
  conversationRefusal,
  invalidMessageBody,
} from './conversation.errors.js';
import {
  DEFAULT_MESSAGE_ORDER,
  MESSAGE_BODY_MAX_LENGTH,
  MESSAGE_BODY_MIN_LENGTH,
  type MessageOrder,
  type MessageRow,
  type MessageView,
  type SendMessageInput,
} from './conversation.types.js';
import { canReadConversation, sendRefusal } from './rules/conversation-access.js';
import { MESSAGE_NOTIFICATION_KIND, planMessageRecipients } from './rules/message-recipients.js';

/** Columns read for presentation. The ticket and the author are never joined (BR4.4, DB-01). */
const MESSAGE_SELECT = { id: true, body: true, authorId: true, sentAt: true } as const;

/** Shown when a referenced row has disappeared, which the foreign key makes impossible. */
const UNKNOWN_AUTHOR_NAME = '—';

/**
 * The conversation of a ticket (WF1, WF2). The facts of the ticket come from the public service
 * of U2 and the author names from the public service of U1, so U3 never repeats a visibility
 * rule and never queries a table of another unit (BR1.1, BR3.3, BR4.4). It is the only place
 * that touches `messages`, and it never writes to the `Ticket` entity (BR4.2).
 */
@Injectable()
export class ConversationService {
  constructor(
    private readonly transactions: TransactionRunner,
    private readonly tickets: TicketsPublicService,
    private readonly notifications: NotificationsPublicService,
    private readonly users: UsersPublicService,
    private readonly clock: Clock,
  ) {}

  private get db(): DatabaseClient {
    return this.transactions.db();
  }

  /**
   * WF1: the messages of a ticket the actor may read, paginated (BR3.1, BR3.2).
   *
   * The order declares the tie-break in the same direction as the order asked for, so the pages
   * of a descending read are exactly the complement of each other when several messages share
   * one instant. Offset pagination over a growing collection can still slide its window, but a
   * message is never edited nor deleted (BR2.3) and a new one always enters at the start of the
   * descending order, so a slid window can only repeat a message the caller already loaded — it
   * can never hide one. The tab joins the pages discarding repeated identifiers, which makes
   * the repetition invisible (review finding R-06).
   */
  async listMessages(
    actor: Actor,
    ticketId: string,
    page: PageRequest,
    order: MessageOrder = DEFAULT_MESSAGE_ORDER,
  ): Promise<Page<MessageView>> {
    const ticket = await this.tickets.getVisibleTicket(actor, ticketId);
    if (!canReadConversation(actor, ticket)) {
      throw conversationNotFound();
    }
    const where = { ticketId: ticket.id };
    const total = await this.db.message.count({ where });
    const rows = await this.db.message.findMany({
      where,
      orderBy: [{ sentAt: order }, { id: order }],
      select: MESSAGE_SELECT,
      ...toSkipTake(page),
    });
    const authors = await this.loadAuthorNames(rows);
    return {
      items: rows.map((row) => toMessageView(row, authors)),
      total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  /**
   * WF2: stores the message, asks U2 for the automatic return to analysis and records the
   * notice, all in the same ambient transaction — either the three of them are stored, or none
   * of them is (BR4.1 to BR4.3).
   */
  async sendMessage(actor: Actor, ticketId: string, input: SendMessageInput): Promise<MessageView> {
    return this.transactions.run(async () => {
      const ticket = await this.tickets.getVisibleTicket(actor, ticketId);
      const refusal = sendRefusal(actor, ticket);
      if (refusal) {
        throw conversationRefusal(refusal);
      }
      // The DTO already trimmed and measured the body; this repeats it because the service is
      // also reached from the tests and from any future caller (BR2.1).
      const body = input.body.trim();
      if (body.length < MESSAGE_BODY_MIN_LENGTH) {
        throw invalidMessageBody('REQUIRED');
      }
      if (body.length > MESSAGE_BODY_MAX_LENGTH) {
        throw invalidMessageBody('TOO_LONG');
      }
      const row = await this.db.message.create({
        data: { ticketId: ticket.id, authorId: actor.id, body, sentAt: this.clock.now() },
        select: MESSAGE_SELECT,
      });
      // BR4.2: U2 decides and applies the transition; U3 never writes to the ticket itself.
      await this.tickets.onRequesterMessage(actor, ticket.id);
      // BR4.3: one notice per recipient, never for the author.
      await this.notifications.record({
        kind: MESSAGE_NOTIFICATION_KIND,
        ticketId: ticket.id,
        recipientIds: planMessageRecipients({
          authorId: actor.id,
          requesterId: ticket.requesterId,
          assigneeId: ticket.assigneeId,
        }),
      });
      return toMessageView(row, await this.loadAuthorNames([row]));
    });
  }

  /** BR3.3: names come from U1 and include users who were deactivated (AC4.1.5). */
  private async loadAuthorNames(rows: readonly MessageRow[]): Promise<Map<string, string>> {
    const ids = uniqueUuids(rows.map((row) => row.authorId));
    if (ids.length === 0) {
      return new Map();
    }
    const summaries = await this.users.findSummariesByIds(ids);
    return new Map(summaries.map((summary) => [summary.id, summary.name]));
  }
}

export function toMessageView(row: MessageRow, authors: Map<string, string>): MessageView {
  return {
    id: row.id,
    body: row.body,
    author: { id: row.authorId, name: authors.get(row.authorId) ?? UNKNOWN_AUTHOR_NAME },
    sentAt: row.sentAt.toISOString(),
  };
}
