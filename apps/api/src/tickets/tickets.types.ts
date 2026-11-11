import type { TicketStatusKey } from './rules/ticket-transitions.js';
import type { QueueSlice, TicketListView } from './rules/ticket-visibility.js';

/** Response shapes of API-U2, with the additive divergences recorded in functional-spec.md. */
export interface UserRefView {
  id: string;
  name: string;
}

export interface CategoryRefView {
  id: string;
  name: string;
}

export interface SectorRefView {
  id: string;
  name: string;
}

export interface TicketStatusRefView {
  id: string;
  key: TicketStatusKey;
  label: string;
}

export interface PriorityRefView {
  id: string;
  label: string;
}

export interface TicketListItemView {
  id: string;
  /** Hash sign followed by the sequential number (BR1.6, Q1). */
  reference: string;
  title: string;
  category: CategoryRefView;
  sector: SectorRefView;
  status: TicketStatusRefView;
  priority: PriorityRefView;
  requester: UserRefView;
  assignee: UserRefView | null;
  /** The assignee can no longer receive tickets of the current sector (BR3.9, Q6). */
  assigneeUnavailable: boolean;
  openedAt: string;
  updatedAt: string;
}

export interface TicketDetailView extends TicketListItemView {
  description: string;
  closedAt: string | null;
}

export type TicketHistoryFieldValue = 'STATUS' | 'ASSIGNEE' | 'SECTOR' | 'PRIORITY';

export interface TicketHistoryEntryView {
  id: string;
  field: TicketHistoryFieldValue;
  /** Names resolved when read (BR2.7, BR5.1); empty when there was no value. */
  previousValue: string | null;
  newValue: string | null;
  /** Justification of the transfer, on sector entries (AC2.4.4). */
  justification: string | null;
  author: UserRefView;
  occurredAt: string;
}

export interface TicketSectorPassageView {
  id: string;
  sector: SectorRefView;
  enteredAt: string;
  leftAt: string | null;
  justification: string | null;
  transferredBy: UserRefView | null;
}

/** BR8.5: who may receive an assignment in the current sector of the ticket. */
export interface AssignableUsersView {
  items: UserRefView[];
}

export interface OpenTicketInput {
  categoryId: string;
  title: string;
  description: string;
  priorityId?: string;
}

/** Sortable fields of the listings (BR2.5); `reference` sorts by the sequential number. */
export const TICKET_SORT_FIELDS = ['updatedAt', 'openedAt', 'reference'] as const;
export type TicketSortField = (typeof TICKET_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export interface TicketListQuery {
  view: TicketListView;
  queue?: QueueSlice;
  statusId?: string;
  categoryId?: string;
  sectorId?: string;
  sort?: TicketSortField;
  order?: SortOrder;
}

export interface TransferTicketInput {
  targetSectorId: string;
  justification: string;
}

/** SVC-03 and SVC-07: the facts another unit needs about a ticket it may see (BR8.1). */
export interface VisibleTicket {
  id: string;
  reference: string;
  requesterId: string;
  assigneeId: string | null;
  sectorId: string;
  /** Sectors the ticket passed through before the current one. */
  passedSectorIds: string[];
  statusKey: string;
  closedAt: string | null;
}

/** SVC-05: filters of the visibility-filtered search (BR8.3). */
export interface TicketSearchFilter {
  statusId?: string;
  categoryId?: string;
  sectorId?: string;
  /** ISO 8601 UTC, inclusive. */
  openedFrom?: string;
  /** ISO 8601 UTC, exclusive. */
  openedTo?: string;
  /**
   * Closing window, inclusive at the start and exclusive at the end. Additive extension used by
   * `getDurationAverages`, because the averages are cut by the closing of the ticket while the
   * counts and the listing are cut by its opening (BR3.1, BR4.3 of U4).
   */
  closedFrom?: string;
  closedTo?: string;
}

export interface TicketListRow {
  id: string;
  reference: string;
  title: string;
  categoryId: string;
  sectorId: string;
  statusId: string;
  priorityId: string;
  assigneeId: string | null;
  /** Additive field of the Bolt of U4: the report listing shows when the ticket was opened. */
  openedAt: string;
  updatedAt: string;
}

/** SVC-05: the three groupings of `countTickets` (BR3.1 of U4). */
export const TICKET_COUNT_GROUP_BY = ['status', 'category', 'sector'] as const;
export type TicketCountGroupBy = (typeof TICKET_COUNT_GROUP_BY)[number];

export function isTicketCountGroupBy(value: unknown): value is TicketCountGroupBy {
  return typeof value === 'string' && (TICKET_COUNT_GROUP_BY as readonly string[]).includes(value);
}

/** SVC-05: one line of a count. A group without tickets in the period is never returned. */
export interface TicketCountGroup {
  groupId: string;
  count: number;
}

/**
 * SVC-05: the two averages of the period, in seconds, each with its own sample (BR4.3 of U4).
 * Declared divergence from the contract block, which had a single `sampleSize`: the handling
 * average excludes the tickets that were closed without ever having an assignee.
 */
export interface DurationAverages {
  averageHandlingSeconds: number | null;
  averageResolutionSeconds: number | null;
  resolutionSampleSize: number;
  handlingSampleSize: number;
}
