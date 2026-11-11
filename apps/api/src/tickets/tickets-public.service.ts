import { Injectable } from '@nestjs/common';
import type { Actor } from '../auth/actor.js';
import { DomainError } from '../common/errors/domain-error.js';
import { toSkipTake, type Page, type PageRequest } from '../common/pagination.js';
import { TransactionRunner, type DatabaseClient } from '../common/prisma/transaction-runner.js';
import { Prisma } from '../generated/prisma/client.js';
import { formatTicketReference } from './rules/ticket-reference.js';
import { visibilityCondition, type TicketWhere } from './rules/ticket-visibility.js';
import { TicketActionsService } from './ticket-actions.service.js';
import { TICKET_SELECT, toTicketListRow } from './tickets.presenter.js';
import { TicketsService } from './tickets.service.js';
import type {
  DurationAverages,
  TicketCountGroup,
  TicketCountGroupBy,
  TicketListRow,
  TicketSearchFilter,
  VisibleTicket,
} from './tickets.types.js';

function parseInstant(value: string, field: string): Date {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    throw new DomainError('VALIDATION_FAILED', 'Invalid instant in the search filter', {
      details: [{ field, code: 'INVALID_DATE' }],
    });
  }
  return instant;
}

function searchFilterCondition(filter: TicketSearchFilter): TicketWhere {
  const where: TicketWhere = {};
  if (filter.statusId) {
    where.statusId = filter.statusId;
  }
  if (filter.categoryId) {
    where.categoryId = filter.categoryId;
  }
  if (filter.sectorId) {
    where.sectorId = filter.sectorId;
  }
  const openedAt: { gte?: Date; lt?: Date } = {};
  if (filter.openedFrom) {
    openedAt.gte = parseInstant(filter.openedFrom, 'openedFrom');
  }
  if (filter.openedTo) {
    openedAt.lt = parseInstant(filter.openedTo, 'openedTo');
  }
  if (openedAt.gte || openedAt.lt) {
    where.openedAt = openedAt;
  }
  return where;
}

/** Combines conditions; no condition at all matches every ticket, as an empty `where` does. */
function allOf(parts: readonly Prisma.Sql[]): Prisma.Sql {
  return parts.length === 0 ? Prisma.sql`TRUE` : Prisma.join(parts, ' AND ', '(', ')');
}

/** An empty alternative matches nothing, as an empty `OR` list does. */
function anyOf(parts: readonly Prisma.Sql[]): Prisma.Sql {
  return parts.length === 0 ? Prisma.sql`FALSE` : Prisma.join(parts, ' OR ', '(', ')');
}

/** Alias of the ticket table in the aggregate query; the rendered columns are prefixed by it. */
const TICKET_ALIAS = Prisma.raw('t');

/**
 * Renders the condition object the rules produce into the SQL of the aggregate query.
 *
 * Averaging a difference between two instants is beyond the aggregate API of Prisma, so the
 * duration averages are one SQL statement. This function is a renderer of the structure
 * `visibilityCondition` and `searchFilterCondition` return — never a second copy of those
 * rules: they stay the single source of truth, every value travels as a query parameter, and an
 * unknown shape fails loudly instead of silently widening what the actor may see.
 */
function toSqlCondition(where: TicketWhere): Prisma.Sql {
  const parts: Prisma.Sql[] = [];
  for (const key of Object.keys(where) as (keyof TicketWhere)[]) {
    switch (key) {
      case 'id': {
        const value = where.id;
        if (typeof value === 'string') {
          parts.push(Prisma.sql`${TICKET_ALIAS}.id = ${value}::uuid`);
        } else if (value) {
          parts.push(anyOf(value.in.map((id) => Prisma.sql`${TICKET_ALIAS}.id = ${id}::uuid`)));
        }
        break;
      }
      case 'requesterId':
        parts.push(Prisma.sql`${TICKET_ALIAS}.requester_id = ${where.requesterId}::uuid`);
        break;
      case 'assigneeId':
        parts.push(
          where.assigneeId === null
            ? Prisma.sql`${TICKET_ALIAS}.assignee_id IS NULL`
            : Prisma.sql`${TICKET_ALIAS}.assignee_id = ${where.assigneeId}::uuid`,
        );
        break;
      case 'sectorId': {
        const value = where.sectorId;
        parts.push(
          typeof value === 'string'
            ? Prisma.sql`${TICKET_ALIAS}.sector_id = ${value}::uuid`
            : Prisma.sql`${TICKET_ALIAS}.sector_id <> ${value?.not}::uuid`,
        );
        break;
      }
      case 'statusId':
        parts.push(Prisma.sql`${TICKET_ALIAS}.status_id = ${where.statusId}::uuid`);
        break;
      case 'categoryId':
        parts.push(Prisma.sql`${TICKET_ALIAS}.category_id = ${where.categoryId}::uuid`);
        break;
      case 'openedAt': {
        const range = where.openedAt ?? {};
        if (range.gte) {
          parts.push(Prisma.sql`${TICKET_ALIAS}.opened_at >= ${range.gte}::timestamptz`);
        }
        if (range.lt) {
          parts.push(Prisma.sql`${TICKET_ALIAS}.opened_at < ${range.lt}::timestamptz`);
        }
        break;
      }
      case 'sectorPassages':
        parts.push(
          Prisma.sql`EXISTS (SELECT 1 FROM ticket_sector_passages p
             WHERE p.ticket_id = ${TICKET_ALIAS}.id
               AND p.sector_id = ${where.sectorPassages?.some.sectorId}::uuid)`,
        );
        break;
      case 'AND':
        parts.push(allOf((where.AND ?? []).map(toSqlCondition)));
        break;
      case 'OR':
        parts.push(anyOf((where.OR ?? []).map(toSqlCondition)));
        break;
      default: {
        const unsupported: never = key;
        throw new DomainError(
          'INTERNAL_ERROR',
          `Ticket condition not supported by the aggregate query: ${String(unsupported)}`,
        );
      }
    }
  }
  return allOf(parts);
}

/** Shape the aggregate statement returns; a sample of zero brings both averages back empty. */
interface DurationAveragesRow {
  resolutionSampleSize: number;
  averageResolutionSeconds: number | null;
  handlingSampleSize: number;
  averageHandlingSeconds: number | null;
}

/**
 * SVC-03, SVC-05 and SVC-07: the public service of Tickets (BR8.1 to BR8.3, BR8.6). It exposes
 * no persistence type, and the only method that writes is the notice of the requester's
 * message. The counts and the duration averages of SVC-05 were deferred by the design of U2 and
 * are implemented here, in the Bolt of U4, by addition: no existing method changed (BR6.2 of U4).
 */
@Injectable()
export class TicketsPublicService {
  constructor(
    private readonly transactions: TransactionRunner,
    private readonly tickets: TicketsService,
    private readonly actions: TicketActionsService,
  ) {}

  private get db(): DatabaseClient {
    return this.transactions.db();
  }

  /** BR8.1: the facts of the ticket, only for an actor who may see it. */
  async getVisibleTicket(actor: Actor, ticketId: string): Promise<VisibleTicket> {
    const row = await this.tickets.findVisibleRow(actor, ticketId);
    const statuses = await this.tickets.loadStatuses();
    const passages = await this.db.ticketSectorPassage.findMany({
      where: { ticketId: row.id, leftAt: { not: null } },
      orderBy: [{ enteredAt: 'asc' }, { id: 'asc' }],
      select: { sectorId: true },
    });
    return {
      id: row.id,
      reference: formatTicketReference(row.number),
      requesterId: row.requesterId,
      assigneeId: row.assigneeId,
      sectorId: row.sectorId,
      passedSectorIds: [...new Set(passages.map((passage) => passage.sectorId))],
      statusKey: statuses.byId.get(row.statusId)?.key ?? 'OPEN',
      closedAt: row.closedAt?.toISOString() ?? null,
    };
  }

  /** BR8.2: applies the automatic return to analysis, in the caller's transaction (WF10). */
  onRequesterMessage(actor: Actor, ticketId: string): Promise<void> {
    return this.actions.applyRequesterMessage(actor, ticketId);
  }

  /** BR8.3: listing filtered by the visibility of the actor, with combined filters. */
  async searchTickets(
    actor: Actor,
    filter: TicketSearchFilter,
    page: PageRequest,
  ): Promise<Page<TicketListRow>> {
    const where = this.visibleTicketsCondition(actor, filter);
    const total = await this.db.ticket.count({ where });
    const rows = await this.db.ticket.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: TICKET_SELECT,
      ...toSkipTake(page),
    });
    return {
      items: rows.map(toTicketListRow),
      total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  /**
   * SVC-05, BR3.1 of U4: how many visible tickets each status, category or sector holds, with
   * the period cutting by the opening of the ticket. The database groups and counts, with the
   * visibility inside the query; nothing is added up in memory from a list, and a group without
   * tickets in the period simply does not come back.
   */
  async countTickets(
    actor: Actor,
    filter: TicketSearchFilter,
    groupBy: TicketCountGroupBy,
  ): Promise<TicketCountGroup[]> {
    const where = this.visibleTicketsCondition(actor, filter);
    switch (groupBy) {
      case 'status': {
        const rows = await this.db.ticket.groupBy({
          by: ['statusId'],
          where,
          _count: { _all: true },
        });
        return rows.map((row) => ({ groupId: row.statusId, count: row._count._all }));
      }
      case 'category': {
        const rows = await this.db.ticket.groupBy({
          by: ['categoryId'],
          where,
          _count: { _all: true },
        });
        return rows.map((row) => ({ groupId: row.categoryId, count: row._count._all }));
      }
      case 'sector': {
        const rows = await this.db.ticket.groupBy({
          by: ['sectorId'],
          where,
          _count: { _all: true },
        });
        return rows.map((row) => ({ groupId: row.sectorId, count: row._count._all }));
      }
    }
  }

  /**
   * SVC-05, BR4.1 to BR4.3 of U4: the two average durations of the period, in seconds.
   *
   * Resolution runs from the opening to the most recent closing, which is what `closedAt` holds:
   * reopening clears the column and the next closing writes it again, so a ticket reopened and
   * closed again counts once, and one reopened and still open stays out. Handling runs from the
   * opening to the first history entry that gave the ticket an assignee, whether somebody took
   * it or somebody assigned it; a later transfer that removes the assignee never moves that
   * milestone. The period cuts by the closing here, while the counts cut by the opening.
   *
   * One aggregate statement, with the visibility of the actor inside it: the database averages,
   * and no list of tickets is ever loaded to be added up in memory.
   */
  async getDurationAverages(actor: Actor, filter: TicketSearchFilter): Promise<DurationAverages> {
    const parts: Prisma.Sql[] = [
      toSqlCondition({ AND: [visibilityCondition(actor), searchFilterCondition(filter)] }),
      Prisma.sql`${TICKET_ALIAS}.closed_at IS NOT NULL`,
    ];
    if (filter.closedFrom) {
      const from = parseInstant(filter.closedFrom, 'closedFrom');
      parts.push(Prisma.sql`${TICKET_ALIAS}.closed_at >= ${from}::timestamptz`);
    }
    if (filter.closedTo) {
      const to = parseInstant(filter.closedTo, 'closedTo');
      parts.push(Prisma.sql`${TICKET_ALIAS}.closed_at < ${to}::timestamptz`);
    }
    const rows = await this.db.$queryRaw<DurationAveragesRow[]>(Prisma.sql`
      WITH visible AS (
        SELECT ${TICKET_ALIAS}.id, ${TICKET_ALIAS}.opened_at, ${TICKET_ALIAS}.closed_at
        FROM tickets ${TICKET_ALIAS}
        WHERE ${allOf(parts)}
      ),
      first_assignment AS (
        SELECT h.ticket_id, MIN(h.occurred_at) AS assigned_at
        FROM ticket_history_entries h
        JOIN visible v ON v.id = h.ticket_id
        WHERE h.field = 'ASSIGNEE' AND h.new_value IS NOT NULL
        GROUP BY h.ticket_id
      )
      SELECT
        COUNT(v.id)::int AS "resolutionSampleSize",
        AVG(EXTRACT(EPOCH FROM (v.closed_at - v.opened_at)))::double precision
          AS "averageResolutionSeconds",
        COUNT(f.assigned_at)::int AS "handlingSampleSize",
        AVG(EXTRACT(EPOCH FROM (f.assigned_at - v.opened_at)))::double precision
          AS "averageHandlingSeconds"
      FROM visible v
      LEFT JOIN first_assignment f ON f.ticket_id = v.id
    `);
    const row = rows[0];
    // An aggregate without GROUP BY always answers one row; an empty period brings zeros.
    return {
      averageHandlingSeconds: row?.averageHandlingSeconds ?? null,
      averageResolutionSeconds: row?.averageResolutionSeconds ?? null,
      resolutionSampleSize: row?.resolutionSampleSize ?? 0,
      handlingSampleSize: row?.handlingSampleSize ?? 0,
    };
  }

  /** The visibility of the actor combined with the filters, always inside the query (BR1.2). */
  private visibleTicketsCondition(
    actor: Actor,
    filter: TicketSearchFilter,
  ): Prisma.TicketWhereInput {
    return { AND: [visibilityCondition(actor), searchFilterCondition(filter)] };
  }
}
