import { isAssigneeUnavailable, type AssigneeSummary } from './rules/assignee-availability.js';
import { formatTicketReference } from './rules/ticket-reference.js';
import type { TicketStatusKey } from './rules/ticket-transitions.js';
import type {
  TicketDetailView,
  TicketHistoryEntryView,
  TicketHistoryFieldValue,
  TicketListItemView,
  TicketListRow,
  TicketSectorPassageView,
  UserRefView,
} from './tickets.types.js';

/** Columns of a ticket read for presentation; no relation of U1 is joined (DB-01). */
export const TICKET_SELECT = {
  id: true,
  number: true,
  title: true,
  description: true,
  requesterId: true,
  assigneeId: true,
  categoryId: true,
  sectorId: true,
  statusId: true,
  priorityId: true,
  openedAt: true,
  updatedAt: true,
  closedAt: true,
} as const;

export interface TicketRow {
  id: string;
  number: number;
  title: string;
  description: string;
  requesterId: string;
  assigneeId: string | null;
  categoryId: string;
  sectorId: string;
  statusId: string;
  priorityId: string;
  openedAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export interface HistoryEntryRow {
  id: string;
  field: TicketHistoryFieldValue;
  previousValue: string | null;
  newValue: string | null;
  justification: string | null;
  authorId: string;
  occurredAt: Date;
}

export interface SectorPassageRow {
  id: string;
  sectorId: string;
  enteredAt: Date;
  leftAt: Date | null;
  justification: string | null;
  transferredById: string | null;
}

export interface StatusRef {
  id: string;
  key: TicketStatusKey;
  label: string;
}

export interface StatusRefs {
  byId: Map<string, StatusRef>;
  byKey: Map<TicketStatusKey, StatusRef>;
}

/** Names resolved when the ticket is read, including deactivated items and users (BR2.7, BR5.3). */
export interface TicketReferences {
  categories: Map<string, string>;
  sectors: Map<string, string>;
  priorities: Map<string, string>;
  statuses: StatusRefs;
  users: Map<string, AssigneeSummary & { name: string }>;
}

/** Shown when a referenced row has disappeared, which foreign keys make impossible. */
const UNKNOWN_LABEL = '—';

export function userRefView(userId: string, users: TicketReferences['users']): UserRefView {
  return { id: userId, name: users.get(userId)?.name ?? UNKNOWN_LABEL };
}

export function toTicketListItem(row: TicketRow, refs: TicketReferences): TicketListItemView {
  const status = refs.statuses.byId.get(row.statusId);
  return {
    id: row.id,
    reference: formatTicketReference(row.number),
    title: row.title,
    category: { id: row.categoryId, name: refs.categories.get(row.categoryId) ?? UNKNOWN_LABEL },
    sector: { id: row.sectorId, name: refs.sectors.get(row.sectorId) ?? UNKNOWN_LABEL },
    status: {
      id: row.statusId,
      key: status?.key ?? 'OPEN',
      label: status?.label ?? UNKNOWN_LABEL,
    },
    priority: { id: row.priorityId, label: refs.priorities.get(row.priorityId) ?? UNKNOWN_LABEL },
    requester: userRefView(row.requesterId, refs.users),
    assignee: row.assigneeId ? userRefView(row.assigneeId, refs.users) : null,
    assigneeUnavailable: isAssigneeUnavailable(
      row.assigneeId,
      row.assigneeId ? refs.users.get(row.assigneeId) : undefined,
      row.sectorId,
    ),
    openedAt: row.openedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toTicketDetail(row: TicketRow, refs: TicketReferences): TicketDetailView {
  return {
    ...toTicketListItem(row, refs),
    description: row.description,
    closedAt: row.closedAt?.toISOString() ?? null,
  };
}

/** SVC-05: the listing row other units receive, with identifiers instead of names. */
export function toTicketListRow(row: TicketRow): TicketListRow {
  return {
    id: row.id,
    reference: formatTicketReference(row.number),
    title: row.title,
    categoryId: row.categoryId,
    sectorId: row.sectorId,
    statusId: row.statusId,
    priorityId: row.priorityId,
    assigneeId: row.assigneeId,
    openedAt: row.openedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function resolveHistoryValue(
  field: TicketHistoryFieldValue,
  value: string | null,
  refs: TicketReferences,
): string | null {
  if (!value) {
    return null;
  }
  switch (field) {
    case 'STATUS':
      return refs.statuses.byId.get(value)?.label ?? UNKNOWN_LABEL;
    case 'ASSIGNEE':
      return refs.users.get(value)?.name ?? UNKNOWN_LABEL;
    case 'SECTOR':
      return refs.sectors.get(value) ?? UNKNOWN_LABEL;
    case 'PRIORITY':
      return refs.priorities.get(value) ?? UNKNOWN_LABEL;
  }
}

export function toHistoryEntryView(
  entry: HistoryEntryRow,
  refs: TicketReferences,
): TicketHistoryEntryView {
  return {
    id: entry.id,
    field: entry.field,
    previousValue: resolveHistoryValue(entry.field, entry.previousValue, refs),
    newValue: resolveHistoryValue(entry.field, entry.newValue, refs),
    justification: entry.justification,
    author: userRefView(entry.authorId, refs.users),
    occurredAt: entry.occurredAt.toISOString(),
  };
}

export function toSectorPassageView(
  passage: SectorPassageRow,
  refs: TicketReferences,
): TicketSectorPassageView {
  return {
    id: passage.id,
    sector: { id: passage.sectorId, name: refs.sectors.get(passage.sectorId) ?? UNKNOWN_LABEL },
    enteredAt: passage.enteredAt.toISOString(),
    leftAt: passage.leftAt?.toISOString() ?? null,
    justification: passage.justification,
    transferredBy: passage.transferredById
      ? userRefView(passage.transferredById, refs.users)
      : null,
  };
}
