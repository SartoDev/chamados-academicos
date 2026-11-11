import { Injectable } from '@nestjs/common';
import type { Actor } from '../auth/actor.js';
import { Clock } from '../common/clock.js';
import { isUniqueConstraintViolation } from '../common/prisma/prisma-errors.js';
import { TransactionRunner, type DatabaseClient } from '../common/prisma/transaction-runner.js';
import type { Prisma } from '../generated/prisma/client.js';
import {
  invalidRatingField,
  ratingAlreadyExists,
  ratingNotFound,
  ratingRefusal,
} from './rating.errors.js';
import {
  toRatingView,
  type RateTicketInput,
  type RatingAverage,
  type RatingSummaryFilter,
  type RatingView,
} from './rating.types.js';
import { readRefusal, rateRefusal } from './rules/rating-access.js';
import { isValidScore, normalizeComment } from './rules/rating-score.js';
import { visibilityCondition } from './rules/ticket-visibility.js';
import { TicketsPublicService } from './tickets-public.service.js';

/** Columns read for presentation. The ticket is never joined for the answer (DB-01). */
const RATING_SELECT = { ticketId: true, score: true, comment: true, ratedAt: true } as const;

/**
 * The rating of a ticket (WF1 to WF4 of U5). The facts of the ticket come from the public
 * service of U2, so U5 never repeats a visibility rule (BR1.1 to BR1.3), and this service is the
 * only place that touches `ticket_ratings`. It never writes to the `Ticket` entity and never
 * creates a notification (BR4.1, BR4.2).
 *
 * U5 hosts its own service inside the Tickets module instead of widening the single public
 * service of U2: the rating table belongs to U5, and the module exports this service so the
 * Reporting module of U4 can compose the summary of BR3.1 without reading the table itself.
 */
@Injectable()
export class RatingService {
  constructor(
    private readonly transactions: TransactionRunner,
    private readonly tickets: TicketsPublicService,
    private readonly clock: Clock,
  ) {}

  private get db(): DatabaseClient {
    return this.transactions.db();
  }

  /**
   * WF2: the rating of a ticket the actor may read (BR1.3). A ticket the actor cannot see was
   * already answered as missing by U2; a ticket that is visible but not yet rated answers
   * `RATING_NOT_FOUND`, which the screen reads as "not rated yet", not as a failure.
   */
  async getRating(actor: Actor, ticketId: string): Promise<RatingView> {
    const ticket = await this.tickets.getVisibleTicket(actor, ticketId);
    const refusal = readRefusal(actor, ticket);
    if (refusal) {
      throw ratingRefusal(refusal);
    }
    const row = await this.db.rating.findUnique({
      where: { ticketId: ticket.id },
      select: RATING_SELECT,
    });
    if (!row) {
      throw ratingNotFound();
    }
    return toRatingView(row);
  }

  /**
   * WF1: stores the first and only rating of a closed ticket, for its requester (BR1.1, BR1.2,
   * BR2.1 to BR2.3). No notification is created (BR4.2), and the ticket itself is not touched.
   *
   * The uniqueness is decided twice on purpose: the read below refuses the second attempt with
   * the code the screen translates, and the unique index of `ticket_ratings` refuses it again if
   * two requests of the same requester arrive at the same instant. The Prisma violation is
   * converted here and never reaches the response (NFR3).
   */
  async rateTicket(actor: Actor, ticketId: string, input: RateTicketInput): Promise<RatingView> {
    return this.transactions.run(async () => {
      const ticket = await this.tickets.getVisibleTicket(actor, ticketId);
      const refusal = rateRefusal(actor, ticket);
      if (refusal) {
        throw ratingRefusal(refusal);
      }
      // The DTO already validated both fields; this repeats it because the service is also
      // reached from the tests and from any future caller (BR2.1, BR2.2).
      if (!isValidScore(input.score)) {
        throw invalidRatingField('score', 'OUT_OF_RANGE');
      }
      const comment = normalizeComment(input.comment);
      if (comment.refusal) {
        throw invalidRatingField('comment', comment.refusal);
      }
      const existing = await this.db.rating.findUnique({
        where: { ticketId: ticket.id },
        select: { ticketId: true },
      });
      if (existing) {
        throw ratingAlreadyExists();
      }
      try {
        const row = await this.db.rating.create({
          data: {
            ticketId: ticket.id,
            score: input.score,
            comment: comment.value,
            ratedAt: this.clock.now(),
          },
          select: RATING_SELECT,
        });
        return toRatingView(row);
      } catch (error) {
        if (isUniqueConstraintViolation(error)) {
          throw ratingAlreadyExists();
        }
        throw error;
      }
    });
  }

  /**
   * WF3, BR3.1 to BR3.3: the average and the count of the ratings whose ticket the actor may see
   * and whose most recent closing falls inside the window, the same cut the duration averages of
   * U4 use. The database averages and counts, with the visibility of the actor inside the query:
   * no list of ratings is ever loaded to be added up in memory, and neither the comment nor the
   * ticket identifier leaves this method.
   *
   * Because the cut is the current closing of the ticket and not the instant of the rating, a
   * reopened ticket has no closing and leaves every average until it is closed again — exactly
   * what the duration averages already do (BR3.1, Q5).
   */
  async summarize(actor: Actor, filter: RatingSummaryFilter): Promise<RatingAverage> {
    const where: Prisma.RatingWhereInput = {
      ticket: {
        AND: [
          visibilityCondition(actor),
          {
            closedAt: {
              not: null,
              gte: new Date(filter.closedFrom),
              lt: new Date(filter.closedTo),
            },
          },
        ],
      },
    };
    const aggregate = await this.db.rating.aggregate({
      where,
      _avg: { score: true },
      _count: { _all: true },
    });
    const count = aggregate._count._all;
    // An empty window answers an empty average and a zero count, never a zero read as a score.
    return { averageScore: count === 0 ? null : (aggregate._avg.score ?? null), count };
  }
}
