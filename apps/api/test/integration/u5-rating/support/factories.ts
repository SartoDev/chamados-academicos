import type { PrismaService } from '../../../../src/common/prisma/prisma.service.js';
import { createTicket, type TicketOverrides } from '../../u2-tickets/support/factories.js';
import type { TicketScenario } from '../../u2-tickets/support/scenario.js';

/** Instant the rating factories count from, so nothing depends on real time passing. */
export const RATING_START = new Date('2026-09-15T12:00:00.000Z');

export interface RatingOverrides {
  id?: string;
  score?: number;
  comment?: string | null;
  ratedAt?: Date;
}

export interface CreateRatingInput extends RatingOverrides {
  ticketId: string;
}

/** One rating of a ticket. Uniqueness per ticket is enforced by the database (BR2.3). */
export function createRating(prisma: PrismaService, input: CreateRatingInput) {
  return prisma.rating.create({
    data: {
      ...(input.id === undefined ? {} : { id: input.id }),
      ticketId: input.ticketId,
      score: input.score ?? 4,
      comment: input.comment === undefined ? null : input.comment,
      ratedAt: input.ratedAt ?? RATING_START,
    },
  });
}

/** A comment of exactly `length` characters, to exercise both ends of the limit (BR2.2). */
export function ratingCommentOfLength(length: number): string {
  return 'a'.repeat(length);
}

export interface ClosedTicketInput extends TicketOverrides {
  openedAt: Date;
  /** Instant of the most recent closing; the rating summary cuts by it (BR3.1). */
  closedAt: Date;
}

/**
 * A closed ticket of the student in Secretaria, with both instants chosen by the caller, so
 * every bound of the rating summary is verifiable by arithmetic (BR3.1).
 */
export function closedTicketOfStudent(
  prisma: PrismaService,
  scenario: TicketScenario,
  input: ClosedTicketInput,
) {
  return createTicket(prisma, {
    requesterId: scenario.users.student,
    categoryId: scenario.categories.documentos,
    sectorId: scenario.sectors.secretaria,
    statusId: scenario.statuses.CLOSED,
    priorityId: scenario.priorities.normal,
    ...input,
    updatedAt: input.updatedAt ?? input.closedAt,
  });
}
