/** Response shapes of API-U5, with the divergences recorded in functional-spec.md of U5. */

/**
 * API-U5 `Rating`. It is written once and never changes: there is no edit and no delete
 * operation, so nothing here is ever updated after the first read (BR2.3, BR2.4).
 */
export interface RatingView {
  ticketId: string;
  /** Integer from 1 to 5; the Portuguese label of each value lives in the web app (BR2.1). */
  score: number;
  comment: string | null;
  ratedAt: string;
}

/**
 * Average and count of the ratings of a window, with no ticket identifier and no comment, so
 * the panel never reconstructs who rated what (BR3.1, BR3.3).
 */
export interface RatingAverage {
  averageScore: number | null;
  count: number;
}

/**
 * The window the summary cuts by: the most recent closing of the ticket, the same cut the
 * duration averages of U4 use, and not the instant of the rating itself (BR3.1, Q5).
 */
export interface RatingSummaryFilter {
  /** ISO 8601 UTC, inclusive. */
  closedFrom: string;
  /** ISO 8601 UTC, exclusive. */
  closedTo: string;
}

export interface RateTicketInput {
  score: number;
  comment?: string | null;
}

/** Columns of a rating read for presentation; no relation of another unit is joined (DB-01). */
export interface RatingRow {
  ticketId: string;
  score: number;
  comment: string | null;
  ratedAt: Date;
}

export function toRatingView(row: RatingRow): RatingView {
  return {
    ticketId: row.ticketId,
    score: row.score,
    comment: row.comment,
    ratedAt: row.ratedAt.toISOString(),
  };
}
