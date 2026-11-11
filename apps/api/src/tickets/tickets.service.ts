import { Injectable } from '@nestjs/common';
import type { Actor } from '../auth/actor.js';
import { CatalogPublicService } from '../catalog/catalog-public.service.js';
import { Clock } from '../common/clock.js';
import { toSkipTake, type Page, type PageRequest } from '../common/pagination.js';
import { TransactionRunner, type DatabaseClient } from '../common/prisma/transaction-runner.js';
import { isUuid, uniqueUuids } from '../common/uuid.js';
import { UsersPublicService } from '../users/users-public.service.js';
import {
  canOpenTicket,
  ticketActionRefusal,
  type PolicyTicket,
} from './rules/ticket-action-policy.js';
import { TICKET_STATUS_KEYS, type TicketStatusKey } from './rules/ticket-transitions.js';
import {
  listCondition,
  listViewRefusal,
  visibilityCondition,
  type TicketWhere,
} from './rules/ticket-visibility.js';
import { ticketNotFound, ticketRefusal } from './tickets.errors.js';
import {
  TICKET_SELECT,
  toHistoryEntryView,
  toSectorPassageView,
  toTicketDetail,
  toTicketListItem,
  type HistoryEntryRow,
  type StatusRefs,
  type TicketReferences,
  type TicketRow,
} from './tickets.presenter.js';
import type {
  AssignableUsersView,
  OpenTicketInput,
  SortOrder,
  TicketDetailView,
  TicketHistoryEntryView,
  TicketHistoryFieldValue,
  TicketListItemView,
  TicketListQuery,
  TicketSectorPassageView,
} from './tickets.types.js';

interface ReferenceIds {
  categoryIds?: string[];
  sectorIds?: string[];
  priorityIds?: string[];
  userIds?: string[];
}

type TicketOrderBy = Array<
  { updatedAt: SortOrder } | { openedAt: SortOrder } | { number: SortOrder } | { id: SortOrder }
>;

function orderFor(query: TicketListQuery): TicketOrderBy {
  const direction: SortOrder = query.order ?? 'desc';
  switch (query.sort ?? 'updatedAt') {
    case 'openedAt':
      return [{ openedAt: direction }, { id: direction }];
    case 'reference':
      return [{ number: direction }, { id: direction }];
    default:
      return [{ updatedAt: direction }, { id: direction }];
  }
}

/** BR2.5: filters by status, category and sector, combinable with the visibility. */
function filterCondition(query: TicketListQuery): TicketWhere {
  const where: TicketWhere = {};
  if (query.statusId) {
    where.statusId = query.statusId;
  }
  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }
  if (query.sectorId) {
    where.sectorId = query.sectorId;
  }
  return where;
}

function historyValuesOf(
  entries: readonly HistoryEntryRow[],
  field: TicketHistoryFieldValue,
): string[] {
  return entries
    .filter((entry) => entry.field === field)
    .flatMap((entry) => [entry.previousValue, entry.newValue])
    .filter((value): value is string => value !== null);
}

/**
 * Reading and opening tickets (WF1, WF2). Every query carries the visibility condition of the
 * actor inside it (BR2.1 to BR2.3), and names of categories, sectors, statuses, priorities and
 * people are resolved through the public services of U1 (BR2.7, DB-01).
 */
@Injectable()
export class TicketsService {
  constructor(
    private readonly transactions: TransactionRunner,
    private readonly catalog: CatalogPublicService,
    private readonly users: UsersPublicService,
    private readonly clock: Clock,
  ) {}

  private get db(): DatabaseClient {
    return this.transactions.db();
  }

  /** WF1: the sector comes from the category and the ticket is born open, without assignee. */
  async open(actor: Actor, input: OpenTicketInput): Promise<TicketDetailView> {
    if (!canOpenTicket(actor.role)) {
      throw ticketRefusal('FORBIDDEN');
    }
    return this.transactions.run(async () => {
      const category = await this.catalog.getActiveCategory(input.categoryId);
      const priority = input.priorityId
        ? await this.catalog.getActivePriority(input.priorityId)
        : await this.catalog.getDefaultPriority();
      const open = await this.catalog.getStatusByKey('OPEN');
      const now = this.clock.now();
      const ticket = await this.db.ticket.create({
        data: {
          title: input.title.trim(),
          description: input.description.trim(),
          requesterId: actor.id,
          categoryId: category.id,
          sectorId: category.sectorId,
          statusId: open.id,
          priorityId: priority.id,
          openedAt: now,
          updatedAt: now,
          // BR1.5, BR5.2: the ticket arrives in the sector of its category.
          sectorPassages: { create: { sectorId: category.sectorId, enteredAt: now } },
        },
        select: TICKET_SELECT,
      });
      return this.present(ticket);
    });
  }

  /** WF2: my tickets, the sector queue with its slice, or everything (BR2.5, BR2.6, BR2.9). */
  async list(
    actor: Actor,
    query: TicketListQuery,
    page: PageRequest,
  ): Promise<Page<TicketListItemView>> {
    const refusal = listViewRefusal(query.view, actor);
    if (refusal) {
      throw ticketRefusal(refusal);
    }
    const where: TicketWhere = {
      AND: [
        visibilityCondition(actor),
        listCondition(query.view, query.queue ?? 'all', actor),
        filterCondition(query),
      ],
    };
    const total = await this.db.ticket.count({ where });
    const rows = await this.db.ticket.findMany({
      where,
      orderBy: orderFor(query),
      select: TICKET_SELECT,
      ...toSkipTake(page),
    });
    const references = await this.loadTicketReferences(rows);
    return {
      items: rows.map((row) => toTicketListItem(row, references)),
      total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  async getDetail(actor: Actor, ticketId: string): Promise<TicketDetailView> {
    return this.present(await this.findVisibleRow(actor, ticketId));
  }

  /** BR2.8: the history is visible to whoever sees the ticket, and to nobody else. */
  async listHistory(
    actor: Actor,
    ticketId: string,
    page: PageRequest,
  ): Promise<Page<TicketHistoryEntryView>> {
    await this.assertVisible(actor, ticketId);
    const where = { ticketId };
    const total = await this.db.ticketHistoryEntry.count({ where });
    const entries = await this.db.ticketHistoryEntry.findMany({
      where,
      // Chronological; entries written by the same operation share the instant, so the field
      // order of the enum keeps the reading stable.
      orderBy: [{ occurredAt: 'asc' }, { field: 'asc' }, { id: 'asc' }],
      ...toSkipTake(page),
    });
    const references = await this.loadReferences({
      sectorIds: historyValuesOf(entries, 'SECTOR'),
      priorityIds: historyValuesOf(entries, 'PRIORITY'),
      userIds: [...entries.map((entry) => entry.authorId), ...historyValuesOf(entries, 'ASSIGNEE')],
    });
    return {
      items: entries.map((entry) => toHistoryEntryView(entry, references)),
      total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  /** BR5.2, AC2.4.7: every sector the ticket passed through, with entry and exit. */
  async listPassages(
    actor: Actor,
    ticketId: string,
    page: PageRequest,
  ): Promise<Page<TicketSectorPassageView>> {
    await this.assertVisible(actor, ticketId);
    const where = { ticketId };
    const total = await this.db.ticketSectorPassage.count({ where });
    const passages = await this.db.ticketSectorPassage.findMany({
      where,
      orderBy: [{ enteredAt: 'asc' }, { id: 'asc' }],
      ...toSkipTake(page),
    });
    const references = await this.loadReferences({
      sectorIds: passages.map((passage) => passage.sectorId),
      userIds: passages
        .map((passage) => passage.transferredById)
        .filter((id): id is string => id !== null),
    });
    return {
      items: passages.map((passage) => toSectorPassageView(passage, references)),
      total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  /** BR8.5: only the manager of the current sector lists who may receive the assignment. */
  async listAssignableUsers(actor: Actor, ticketId: string): Promise<AssignableUsersView> {
    const row = await this.findVisibleRow(actor, ticketId);
    const refusal = ticketActionRefusal(
      'LIST_ASSIGNABLE',
      actor,
      this.policyTicketOf(row, await this.loadStatuses()),
    );
    if (refusal) {
      throw ticketRefusal(refusal);
    }
    return { items: await this.users.findAssignableInSector(row.sectorId) };
  }

  /** The ticket when the actor may see it, TICKET_NOT_FOUND otherwise (BR2.1 to BR2.4). */
  async findVisibleRow(actor: Actor, ticketId: string): Promise<TicketRow> {
    const row = isUuid(ticketId)
      ? await this.db.ticket.findFirst({
          where: { AND: [{ id: ticketId }, visibilityCondition(actor)] },
          select: TICKET_SELECT,
        })
      : null;
    if (!row) {
      throw ticketNotFound();
    }
    return row;
  }

  async assertVisible(actor: Actor, ticketId: string): Promise<string> {
    const row = isUuid(ticketId)
      ? await this.db.ticket.findFirst({
          where: { AND: [{ id: ticketId }, visibilityCondition(actor)] },
          select: { id: true },
        })
      : null;
    if (!row) {
      throw ticketNotFound();
    }
    return row.id;
  }

  /** The four statuses by identifier and by stable key (M2, BR8.7 of U1). */
  async loadStatuses(): Promise<StatusRefs> {
    const byId = new Map<string, { id: string; key: TicketStatusKey; label: string }>();
    const byKey = new Map<TicketStatusKey, { id: string; key: TicketStatusKey; label: string }>();
    for (const key of TICKET_STATUS_KEYS) {
      const status = await this.catalog.getStatusByKey(key);
      const ref = { id: status.id, key, label: status.name };
      byId.set(ref.id, ref);
      byKey.set(key, ref);
    }
    return { byId, byKey };
  }

  policyTicketOf(row: TicketRow, statuses: StatusRefs): PolicyTicket {
    return {
      requesterId: row.requesterId,
      assigneeId: row.assigneeId,
      sectorId: row.sectorId,
      statusKey: statuses.byId.get(row.statusId)?.key ?? 'OPEN',
    };
  }

  async present(row: TicketRow): Promise<TicketDetailView> {
    return toTicketDetail(row, await this.loadTicketReferences([row]));
  }

  private loadTicketReferences(rows: readonly TicketRow[]): Promise<TicketReferences> {
    return this.loadReferences({
      categoryIds: rows.map((row) => row.categoryId),
      sectorIds: rows.map((row) => row.sectorId),
      priorityIds: rows.map((row) => row.priorityId),
      userIds: rows.flatMap((row) =>
        row.assigneeId ? [row.requesterId, row.assigneeId] : [row.requesterId],
      ),
    });
  }

  /** Inactive catalog items and deactivated users are resolved too (BR5.3, AC4.1.5). */
  private async loadReferences(ids: ReferenceIds): Promise<TicketReferences> {
    const labels = await this.catalog.findLabels({
      categoryIds: uniqueUuids(ids.categoryIds),
      sectorIds: uniqueUuids(ids.sectorIds),
      priorityIds: uniqueUuids(ids.priorityIds),
    });
    const users = await this.users.findSummariesByIds(uniqueUuids(ids.userIds));
    const statuses = await this.loadStatuses();
    return {
      categories: new Map(labels.categories.map((item) => [item.id, item.name])),
      sectors: new Map(labels.sectors.map((item) => [item.id, item.name])),
      priorities: new Map(labels.priorities.map((item) => [item.id, item.name])),
      statuses,
      users: new Map(users.map((user) => [user.id, user])),
    };
  }
}
