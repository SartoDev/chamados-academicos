import type { Role } from '../../common/roles.js';
import { isSectorRole, type PolicyActor } from './ticket-action-policy.js';

/**
 * Visibility and listing slices (BR2.1 to BR2.3, BR2.6, BR8.3). Pure module: it builds the
 * condition that goes inside the query, so the actor is always filtered by the database and
 * never compared after reading (NFR1, team.md).
 */
export const TICKET_LIST_VIEWS = ['requested', 'queue', 'all'] as const;
export type TicketListView = (typeof TICKET_LIST_VIEWS)[number];

export const QUEUE_SLICES = ['unassigned', 'mine', 'all', 'passed'] as const;
export type QueueSlice = (typeof QUEUE_SLICES)[number];

/**
 * The subset of ticket query conditions these rules produce. Structural on purpose: no Prisma
 * type reaches the rules, and the services hand it straight to the query.
 */
export interface TicketWhere {
  id?: string | { in: string[] };
  requesterId?: string;
  assigneeId?: string | null;
  sectorId?: string | { not: string };
  statusId?: string;
  categoryId?: string;
  openedAt?: { gte?: Date; lt?: Date };
  sectorPassages?: { some: { sectorId: string } };
  AND?: TicketWhere[];
  OR?: TicketWhere[];
}

/** An identifier is never in an empty list: an actor without sector sees no ticket (BR2.2). */
const MATCHES_NOTHING: TicketWhere = { id: { in: [] } };

/** BR2.1 to BR2.3: what the actor may read, whatever the path that led to the query. */
export function visibilityCondition(actor: PolicyActor): TicketWhere {
  if (actor.role === 'ADMIN') {
    return {};
  }
  if (isSectorRole(actor.role)) {
    if (!actor.sectorId) {
      return MATCHES_NOTHING;
    }
    const sectorId = actor.sectorId;
    return { OR: [{ sectorId }, { sectorPassages: { some: { sectorId } } }] };
  }
  return { requesterId: actor.id };
}

/** BR2.9: which roles may ask for each listing. */
export const VIEW_ROLES: Record<TicketListView, readonly Role[]> = {
  requested: ['STUDENT', 'PROFESSOR'],
  queue: ['AGENT', 'MANAGER'],
  all: ['ADMIN'],
};

export function listViewRefusal(
  view: TicketListView,
  actor: PolicyActor,
): 'FORBIDDEN' | 'TICKET_QUEUE_NO_SECTOR' | null {
  if (!VIEW_ROLES[view].includes(actor.role)) {
    return 'FORBIDDEN';
  }
  // BR2.2, BR2.6: the queue is the queue of a sector, so an actor without one cannot open it.
  return view === 'queue' && !actor.sectorId ? 'TICKET_QUEUE_NO_SECTOR' : null;
}

/** BR2.6: the four slices of the sector queue. */
export function queueSliceCondition(
  slice: QueueSlice,
  sectorId: string,
  actorId: string,
): TicketWhere {
  switch (slice) {
    case 'unassigned':
      return { sectorId, assigneeId: null };
    case 'mine':
      return { sectorId, assigneeId: actorId };
    case 'all':
      return { sectorId };
    case 'passed':
      // Tickets this sector handled before and that sit in another sector today, read-only.
      return { sectorId: { not: sectorId }, sectorPassages: { some: { sectorId } } };
  }
}

/** The condition of one listing, still combined with the visibility by the service. */
export function listCondition(
  view: TicketListView,
  slice: QueueSlice,
  actor: PolicyActor,
): TicketWhere {
  if (view === 'requested') {
    return { requesterId: actor.id };
  }
  if (view === 'all') {
    return {};
  }
  return actor.sectorId ? queueSliceCondition(slice, actor.sectorId, actor.id) : MATCHES_NOTHING;
}

export function isTicketListView(value: unknown): value is TicketListView {
  return typeof value === 'string' && (TICKET_LIST_VIEWS as readonly string[]).includes(value);
}

export function isQueueSlice(value: unknown): value is QueueSlice {
  return typeof value === 'string' && (QUEUE_SLICES as readonly string[]).includes(value);
}
