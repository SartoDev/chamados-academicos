/** Shapes of API-U1 responses consumed by the web app. */
export type Role = 'STUDENT' | 'PROFESSOR' | 'AGENT' | 'MANAGER' | 'ADMIN';

export interface SectorRef {
  id: string;
  name: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  sector: SectorRef | null;
}

export interface User extends CurrentUser {
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sector {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  sector: SectorRef;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StatusKey = 'OPEN' | 'IN_ANALYSIS' | 'WAITING_REQUESTER' | 'CLOSED';

export interface Status {
  id: string;
  key: StatusKey;
  label: string;
}

export interface Priority {
  id: string;
  label: string;
  isDefault: boolean;
  active: boolean;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Shapes of API-U2 responses (tickets and notifications). */
export interface UserRef {
  id: string;
  name: string;
}

export interface CategoryRef {
  id: string;
  name: string;
}

export interface TicketStatusRef {
  id: string;
  key: StatusKey;
  label: string;
}

export interface PriorityRef {
  id: string;
  label: string;
}

/** Listing slices: the actor's own tickets, the sector queue, or everything (ADMIN). */
export type TicketListView = 'requested' | 'queue' | 'all';
export type QueueSlice = 'unassigned' | 'mine' | 'all' | 'passed';
export type TicketSortField = 'updatedAt' | 'openedAt' | 'reference';
export type SortOrder = 'asc' | 'desc';

export interface TicketListItem {
  id: string;
  /** Visible identifier, a hash sign followed by the sequential number (BR1.6). */
  reference: string;
  title: string;
  category: CategoryRef;
  sector: SectorRef;
  status: TicketStatusRef;
  priority: PriorityRef;
  requester: UserRef;
  assignee: UserRef | null;
  /** The assignee can no longer be given tickets of the current sector (BR3.9). */
  assigneeUnavailable: boolean;
  openedAt: string;
  updatedAt: string;
}

export interface TicketDetail extends TicketListItem {
  description: string;
  closedAt: string | null;
}

export type TicketHistoryField = 'STATUS' | 'ASSIGNEE' | 'SECTOR' | 'PRIORITY';

export interface TicketHistoryEntry {
  id: string;
  field: TicketHistoryField;
  /** Names resolved when read; empty when there was no previous or no new value (BR5.1). */
  previousValue: string | null;
  newValue: string | null;
  /** Filled on sector entries with the justification of the transfer (AC2.4.4). */
  justification: string | null;
  author: UserRef;
  occurredAt: string;
}

export interface TicketSectorPassage {
  id: string;
  sector: SectorRef;
  enteredAt: string;
  leftAt: string | null;
  justification: string | null;
  transferredBy: UserRef | null;
}

/** Who may receive an assignment in the ticket's current sector (BR8.5). */
export interface AssignableUsers {
  items: UserRef[];
}

export type NotificationKind =
  'MESSAGE_RECEIVED' | 'STATUS_CHANGED' | 'ASSIGNEE_CHANGED' | 'SECTOR_CHANGED' | 'TICKET_REOPENED';

export interface NotificationTicketRef {
  id: string;
  reference: string;
  title: string;
}

export interface TicketNotification {
  id: string;
  kind: NotificationKind;
  ticket: NotificationTicketRef;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface UnreadNotificationCount {
  count: number;
}

/** Shapes of API-U3 responses (conversation). */

/** Reading order of `listMessages`; `desc` brings the most recent page first (BR3.2). */
export type MessageOrder = 'asc' | 'desc';

export interface Message {
  id: string;
  body: string;
  /** Resolved when read, so a deactivated author keeps their name (BR3.3). */
  author: UserRef;
  sentAt: string;
}

/** The paginated shape of `listMessages`, the `Page` of X-01 over `Message`. */
export type MessagePage = Page<Message>;

/** Shapes of API-U4 responses (reporting). */

/** The three groupings offered by `getTicketCounts` (BR3.1). */
export type ReportGroupBy = 'status' | 'category' | 'sector';

/** Identifier and displayed name of a catalog item or a person on a report row (BR3.3). */
export interface ReportRef {
  id: string;
  name: string;
}

export interface TicketCountGroup {
  id: string;
  label: string;
  count: number;
}

export interface TicketCounts {
  /** Only the groups with at least one ticket in the period; the screen fills the rest (BR7.1). */
  groups: TicketCountGroup[];
  total: number;
  from: string;
  to: string;
}

/**
 * Averages in seconds, empty when the corresponding sample is empty, and never accompanied by a
 * goal or a threshold (BR4.3, BR4.4). The two samples differ: handling excludes the tickets that
 * never had an assignee.
 */
export interface DurationAverages {
  averageHandlingSeconds: number | null;
  averageResolutionSeconds: number | null;
  resolutionSampleSize: number;
  handlingSampleSize: number;
  from: string;
  to: string;
}

/** One row of the filtered listing of the manager (BR5.1). No duration column, no export. */
export interface ReportTicket {
  id: string;
  reference: string;
  title: string;
  category: ReportRef;
  sector: ReportRef;
  status: ReportRef;
  priority: ReportRef;
  assignee: ReportRef | null;
  openedAt: string;
  updatedAt: string;
}

/** Shapes of API-U5 responses (rating). */

/**
 * The rating a requester left on a closed ticket. It is written once and never changes, so
 * nothing here is ever updated after the first read (BR2.3, BR2.4).
 */
export interface Rating {
  ticketId: string;
  /** Integer from 1 to 5; the fixed Portuguese label lives in the web app (BR2.1). */
  score: number;
  comment: string | null;
  ratedAt: string;
}

/**
 * Average and count of the ratings of the period, cut by the closing of the ticket like the
 * duration averages of U4. Empty average with a zero count when nothing was rated (BR3.1, BR3.2).
 * The comment never travels here (BR3.3).
 */
export interface RatingSummary {
  averageScore: number | null;
  count: number;
  from: string;
  to: string;
}
