/**
 * Read models of U4 (`entities.md`). The unit owns no entity: these are the shapes it computes
 * from what the public services of U2 and U1 return. Field names are identifiers and stay in
 * English; the Portuguese labels shown on screen live in the web app.
 */

/** Identifier and displayed name of a catalog item or of a person, resolved when read (BR3.3). */
export interface ReportRefView {
  id: string;
  name: string;
}

/** One line of a count, by status, category or sector. */
export interface TicketCountGroupView {
  id: string;
  label: string;
  count: number;
}

/** Result of one grouped count, with the period that produced it (BR3.1, BR3.2). */
export interface TicketCountsView {
  groups: TicketCountGroupView[];
  total: number;
  from: string;
  to: string;
}

/**
 * The two average durations of the period, in seconds, with no goal and no threshold (BR4.4).
 * Each average carries its own sample, because their populations differ (BR4.3).
 */
export interface DurationAveragesView {
  averageHandlingSeconds: number | null;
  averageResolutionSeconds: number | null;
  resolutionSampleSize: number;
  handlingSampleSize: number;
  from: string;
  to: string;
}

/**
 * Average and count of the ratings of the period, added to the panel by U5 (BR3.1 of U5). The
 * period cuts by the closing of the ticket, like the duration averages; an empty average with a
 * zero count is what a period without ratings answers, never a zero read as a score (BR3.2 of
 * U5). Neither the comment nor any ticket identifier travels here (BR3.3 of U5).
 */
export interface RatingSummaryView {
  averageScore: number | null;
  count: number;
  from: string;
  to: string;
}

/** One row of the filtered listing: no duration column and no export anywhere (BR5.1, BR5.2). */
export interface ReportTicketRowView {
  id: string;
  reference: string;
  title: string;
  category: ReportRefView;
  sector: ReportRefView;
  status: ReportRefView;
  priority: ReportRefView;
  assignee: ReportRefView | null;
  openedAt: string;
  updatedAt: string;
}

/** Optional, combinable filters of the listing (BR5.1). */
export interface ReportTicketFilter {
  statusId?: string;
  categoryId?: string;
  sectorId?: string;
}
