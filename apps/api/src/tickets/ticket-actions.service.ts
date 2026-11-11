import { Injectable } from '@nestjs/common';
import type { Actor } from '../auth/actor.js';
import { CatalogPublicService } from '../catalog/catalog-public.service.js';
import { Clock } from '../common/clock.js';
import { DomainError } from '../common/errors/domain-error.js';
import { TransactionRunner, type DatabaseClient } from '../common/prisma/transaction-runner.js';
import { NotificationsPublicService } from '../notifications/notifications-public.service.js';
import {
  groupTargetsByKind,
  planTicketNotifications,
  type NotifiableOperation,
  type TicketChanges,
} from '../notifications/rules/notification-recipients.js';
import { UsersPublicService } from '../users/users-public.service.js';
import { reopenWindowRefusal } from './rules/reopen-window.js';
import {
  assignTargetRefusal,
  assumeConflictRefusal,
  ticketActionRefusal,
  transferTargetRefusal,
  type PolicyTicket,
} from './rules/ticket-action-policy.js';
import {
  resolveTransition,
  type TicketStatusKey,
  type TicketTransitionAction,
} from './rules/ticket-transitions.js';
import { invalidTransition, ticketRefusal, type TicketRefusalCode } from './tickets.errors.js';
import type { StatusRefs, TicketRow } from './tickets.presenter.js';
import { TicketsService } from './tickets.service.js';
import type {
  TicketDetailView,
  TicketHistoryFieldValue,
  TransferTicketInput,
} from './tickets.types.js';

interface LockedTicket {
  row: TicketRow;
  statusKey: TicketStatusKey;
  statuses: StatusRefs;
  policy: PolicyTicket;
}

interface HistoryDraft {
  field: TicketHistoryFieldValue;
  previousValue: string | null;
  newValue: string | null;
  justification?: string;
}

/** What one operation changes. Anything left undefined stays as it is. */
interface ChangeRequest {
  operation: NotifiableOperation;
  assigneeId?: string | null;
  statusKey?: TicketStatusKey;
  sectorId?: string;
  priorityId?: string;
  closedAt?: Date | null;
  /** Transfer only: it goes to the passage that closes and to the sector history entry. */
  justification?: string;
}

/**
 * Actions that change a ticket (WF3 to WF10). Every one of them runs inside the ambient
 * transaction (BR7.1): the visibility is applied, the row is locked and re-read (BR7.2, BR7.3),
 * the policy and the transition machine decide, and the change, its history, its passages and
 * its notifications are written together or not at all (BR6.3).
 */
@Injectable()
export class TicketActionsService {
  constructor(
    private readonly transactions: TransactionRunner,
    private readonly tickets: TicketsService,
    private readonly catalog: CatalogPublicService,
    private readonly users: UsersPublicService,
    private readonly notifications: NotificationsPublicService,
    private readonly clock: Clock,
  ) {}

  private get db(): DatabaseClient {
    return this.transactions.db();
  }

  /** WF3: the actor becomes the assignee; an open ticket moves to analysis. */
  async assume(actor: Actor, ticketId: string): Promise<TicketDetailView> {
    return this.transactions.run(async () => {
      const ticket = await this.lockVisibleTicket(actor, ticketId);
      this.refuseIf(ticketActionRefusal('ASSUME', actor, ticket.policy));
      const currentAssigneeId = ticket.row.assigneeId;
      const assigneeAvailable =
        currentAssigneeId !== null && currentAssigneeId !== actor.id
          ? await this.users.isAssignableInSector(currentAssigneeId, ticket.row.sectorId)
          : false;
      const conflict = assumeConflictRefusal(actor, ticket.policy, assigneeAvailable);
      if (conflict && currentAssigneeId) {
        const [assignee] = await this.users.findSummariesByIds([currentAssigneeId]);
        // The refusal names the current assignee, which the screen shows to the actor.
        throw ticketRefusal(conflict, {
          details: { assignee: { id: currentAssigneeId, name: assignee?.name ?? '' } },
        });
      }
      return this.applyChange(actor, ticket, {
        operation: 'ASSUME',
        assigneeId: actor.id,
        statusKey: this.nextStatus(ticket, 'ASSUME'),
      });
    });
  }

  /** WF4: the manager gives the ticket to someone who may receive it in the sector. */
  async assign(actor: Actor, ticketId: string, assigneeId: string): Promise<TicketDetailView> {
    return this.transactions.run(async () => {
      const ticket = await this.lockVisibleTicket(actor, ticketId);
      this.refuseIf(ticketActionRefusal('ASSIGN', actor, ticket.policy));
      const assignable = await this.users.isAssignableInSector(assigneeId, ticket.row.sectorId);
      this.refuseIf(assignTargetRefusal(assignable));
      if (ticket.row.assigneeId === assigneeId) {
        return this.tickets.present(ticket.row);
      }
      return this.applyChange(actor, ticket, {
        operation: 'ASSIGN',
        assigneeId,
        statusKey: this.nextStatus(ticket, 'ASSIGN'),
      });
    });
  }

  /** WF8: closes the current passage, opens the one in the destination and frees the ticket. */
  async transfer(
    actor: Actor,
    ticketId: string,
    input: TransferTicketInput,
  ): Promise<TicketDetailView> {
    return this.transactions.run(async () => {
      const ticket = await this.lockVisibleTicket(actor, ticketId);
      this.refuseIf(ticketActionRefusal('TRANSFER', actor, ticket.policy));
      // BR3.3: the destination must exist and be active before it can be compared.
      await this.catalog.getActiveSector(input.targetSectorId);
      this.refuseIf(transferTargetRefusal(ticket.policy, input.targetSectorId));
      return this.applyChange(actor, ticket, {
        operation: 'TRANSFER',
        sectorId: input.targetSectorId,
        assigneeId: null,
        statusKey: this.nextStatus(ticket, 'TRANSFER'),
        justification: input.justification.trim(),
      });
    });
  }

  /** WF5: only from analysis, by the assignee or the manager of the sector (BR3.4). */
  async waitForRequester(actor: Actor, ticketId: string): Promise<TicketDetailView> {
    return this.transactions.run(async () => {
      const ticket = await this.lockVisibleTicket(actor, ticketId);
      this.refuseIf(ticketActionRefusal('WAIT_FOR_REQUESTER', actor, ticket.policy));
      return this.applyChange(actor, ticket, {
        operation: 'WAIT_FOR_REQUESTER',
        statusKey: this.nextStatus(ticket, 'WAIT_FOR_REQUESTER'),
      });
    });
  }

  /** WF6: the requester closes their own ticket; the attendance closes the ones it handles. */
  async close(actor: Actor, ticketId: string): Promise<TicketDetailView> {
    return this.transactions.run(async () => {
      const ticket = await this.lockVisibleTicket(actor, ticketId);
      this.refuseIf(ticketActionRefusal('CLOSE', actor, ticket.policy));
      const now = this.clock.now();
      return this.applyChange(
        actor,
        ticket,
        { operation: 'CLOSE', statusKey: this.nextStatus(ticket, 'CLOSE'), closedAt: now },
        now,
      );
    });
  }

  /** WF7: the requester reopens within 72 hours, and the last assignee is kept (BR4.3). */
  async reopen(actor: Actor, ticketId: string): Promise<TicketDetailView> {
    return this.transactions.run(async () => {
      const ticket = await this.lockVisibleTicket(actor, ticketId);
      this.refuseIf(ticketActionRefusal('REOPEN', actor, ticket.policy));
      const statusKey = this.nextStatus(ticket, 'REOPEN');
      this.refuseIf(reopenWindowRefusal(ticket.row.closedAt, this.clock.now()));
      return this.applyChange(actor, ticket, {
        operation: 'REOPEN',
        statusKey,
        closedAt: null,
      });
    });
  }

  /** WF9: the sector changes the priority of a ticket it is handling (BR3.7). */
  async changePriority(
    actor: Actor,
    ticketId: string,
    priorityId: string,
  ): Promise<TicketDetailView> {
    return this.transactions.run(async () => {
      const ticket = await this.lockVisibleTicket(actor, ticketId);
      this.refuseIf(ticketActionRefusal('CHANGE_PRIORITY', actor, ticket.policy));
      const priority = await this.catalog.getActivePriority(priorityId);
      if (ticket.row.priorityId === priority.id) {
        return this.tickets.present(ticket.row);
      }
      return this.applyChange(actor, ticket, {
        operation: 'CHANGE_PRIORITY',
        priorityId: priority.id,
      });
    });
  }

  /**
   * WF10, BR8.2: called by U3 after the message is stored, in the same transaction. Only the
   * requester's message, and only while the ticket waits for the requester, moves it back to
   * analysis; every other case does nothing. U3 records the message notification itself.
   */
  async applyRequesterMessage(actor: Actor, ticketId: string): Promise<void> {
    await this.transactions.run(async () => {
      const ticket = await this.lockVisibleTicket(actor, ticketId);
      if (ticket.row.requesterId !== actor.id) {
        return;
      }
      const transition = resolveTransition(ticket.statusKey, 'REQUESTER_MESSAGE');
      if (transition.kind !== 'transition') {
        return;
      }
      await this.applyChange(actor, ticket, {
        operation: 'REQUESTER_MESSAGE',
        statusKey: transition.to,
      });
    });
  }

  private refuseIf(code: TicketRefusalCode | null): void {
    if (code) {
      throw ticketRefusal(code);
    }
  }

  private nextStatus(ticket: LockedTicket, action: TicketTransitionAction): TicketStatusKey {
    const transition = resolveTransition(ticket.statusKey, action);
    if (transition.kind === 'invalid') {
      throw invalidTransition();
    }
    return transition.kind === 'transition' ? transition.to : ticket.statusKey;
  }

  /**
   * Visibility first, so an invisible ticket answers 404 without locking anything; then the row
   * lock, then the state read again, so two concurrent actions never work on a stale ticket.
   */
  private async lockVisibleTicket(actor: Actor, ticketId: string): Promise<LockedTicket> {
    const visibleId = await this.tickets.assertVisible(actor, ticketId);
    await this.db.$queryRaw`SELECT "id" FROM "tickets" WHERE "id" = ${visibleId}::uuid FOR UPDATE`;
    const row = await this.tickets.findVisibleRow(actor, ticketId);
    const statuses = await this.tickets.loadStatuses();
    const statusKey = statuses.byId.get(row.statusId)?.key;
    if (!statusKey) {
      throw new DomainError('INTERNAL_ERROR', 'The ticket status is not one of the stable keys');
    }
    return { row, statusKey, statuses, policy: this.tickets.policyTicketOf(row, statuses) };
  }

  /** Writes the change, its history entries, its passages and its notifications together. */
  private async applyChange(
    actor: Actor,
    ticket: LockedTicket,
    change: ChangeRequest,
    now: Date = this.clock.now(),
  ): Promise<TicketDetailView> {
    const row = ticket.row;
    const assigneeId = change.assigneeId === undefined ? row.assigneeId : change.assigneeId;
    const statusId = change.statusKey
      ? (ticket.statuses.byKey.get(change.statusKey)?.id ?? row.statusId)
      : row.statusId;
    const sectorId = change.sectorId ?? row.sectorId;
    const priorityId = change.priorityId ?? row.priorityId;
    const closedAt = change.closedAt === undefined ? row.closedAt : change.closedAt;

    const changes: TicketChanges = {
      sectorChanged: sectorId !== row.sectorId,
      assigneeChanged: assigneeId !== row.assigneeId,
      statusChanged: statusId !== row.statusId,
    };
    const priorityChanged = priorityId !== row.priorityId;
    const closedAtChanged = (closedAt?.getTime() ?? null) !== (row.closedAt?.getTime() ?? null);
    if (
      !changes.sectorChanged &&
      !changes.assigneeChanged &&
      !changes.statusChanged &&
      !priorityChanged &&
      !closedAtChanged
    ) {
      // BR5.1: an operation that changes nothing writes nothing and records no history.
      return this.tickets.present(row);
    }

    await this.db.ticket.update({
      where: { id: row.id },
      data: { assigneeId, statusId, sectorId, priorityId, closedAt, updatedAt: now },
    });

    if (changes.sectorChanged) {
      // BR5.2: the passage that ends carries the justification and its author.
      await this.db.ticketSectorPassage.updateMany({
        where: { ticketId: row.id, leftAt: null },
        data: {
          leftAt: now,
          justification: change.justification ?? null,
          transferredById: actor.id,
        },
      });
      await this.db.ticketSectorPassage.create({
        data: { ticketId: row.id, sectorId, enteredAt: now },
      });
    }

    const entries: HistoryDraft[] = [];
    if (changes.statusChanged) {
      entries.push({ field: 'STATUS', previousValue: row.statusId, newValue: statusId });
    }
    if (changes.assigneeChanged) {
      entries.push({ field: 'ASSIGNEE', previousValue: row.assigneeId, newValue: assigneeId });
    }
    if (changes.sectorChanged) {
      entries.push({
        field: 'SECTOR',
        previousValue: row.sectorId,
        newValue: sectorId,
        justification: change.justification,
      });
    }
    if (priorityChanged) {
      entries.push({ field: 'PRIORITY', previousValue: row.priorityId, newValue: priorityId });
    }
    if (entries.length > 0) {
      await this.db.ticketHistoryEntry.createMany({
        data: entries.map((entry) => ({
          ticketId: row.id,
          field: entry.field,
          previousValue: entry.previousValue,
          newValue: entry.newValue,
          justification: entry.justification ?? null,
          authorId: actor.id,
          occurredAt: now,
        })),
      });
    }

    const targets = planTicketNotifications({
      operation: change.operation,
      actorId: actor.id,
      requesterId: row.requesterId,
      previousAssigneeId: row.assigneeId,
      changes,
    });
    for (const group of groupTargetsByKind(targets)) {
      await this.notifications.record({
        kind: group.kind,
        ticketId: row.id,
        recipientIds: group.recipientIds,
      });
    }

    return this.tickets.getDetail(actor, row.id);
  }
}
