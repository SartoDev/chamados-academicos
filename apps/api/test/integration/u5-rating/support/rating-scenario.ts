import type { PrismaService } from '../../../../src/common/prisma/prisma.service.js';
import type { TestApp } from '../../u1-foundation/support/test-app.js';
import {
  openTicketOfStudentInSecretaria,
  ticketTransferredFromSecretariaToFinanceiro,
} from '../../u2-tickets/support/factories.js';
import { createTicketScenario, type TicketScenario } from '../../u2-tickets/support/scenario.js';
import { closedTicketOfStudent, createRating } from './factories.js';

const at = (iso: string): Date => new Date(iso);

/** The period every suite of U5 asks for: closed at the start, open at the end, in UTC (BR2.1). */
export const PERIOD_FROM = '2026-09-01T00:00:00.000Z';
export const PERIOD_TO = '2026-10-01T00:00:00.000Z';

/** The instant the controlled clock of the application stands at while the suites run. */
export const RATING_NOW = at(PERIOD_TO);

/** A period that contains no rating at all, to exercise BR3.2. */
export const EMPTY_PERIOD_FROM = '2026-11-01T00:00:00.000Z';
export const EMPTY_PERIOD_TO = '2026-12-01T00:00:00.000Z';

export type RatingTicketKey =
  /** Closed inside the period, rated 4 with a comment: the reading case of every profile. */
  | 'ratedInPeriod'
  /** Closed inside the period, rated 2 without a comment. */
  | 'ratedWithoutComment'
  /** Closed exactly at the start of the period, which includes it; rated 3. */
  | 'ratedAtLowerBound'
  /** Closed exactly at the end of the period, which excludes it; rated 5. */
  | 'ratedAtUpperBound'
  /** Closed before the period; rated 1. */
  | 'ratedBeforePeriod'
  /** Rated 5 and then reopened: no closing instant, so it is out of every average (BR3.1). */
  | 'ratedAndReopened'
  /** Closed in Financeiro without ever touching Secretaria; rated 5: the administrator only. */
  | 'ratedInFinanceiro'
  /** Closed and rated 4, read by Secretaria through its sector passage; outside the period. */
  | 'ratedAfterTransfer'
  /** Closed inside the period and never rated: the ticket the happy path rates. */
  | 'closedUnrated'
  /** A second closed and unrated ticket, so one test may rate without spending the first. */
  | 'closedUnratedSpare'
  /** Closed and unrated, of the other student: the IDOR case (AC5.2.1). */
  | 'closedOfOtherStudent'
  /** Open, never closed: the refusal of BR1.2. */
  | 'openUnrated';

export interface RatingScenario extends TicketScenario {
  tickets: Record<RatingTicketKey, string>;
}

/**
 * Closed tickets at instants chosen by hand, rated and unrated, in two sectors, plus one rated
 * ticket that was reopened. Together they make the average, the count, both bounds of the
 * period, the difference between what the manager and the administrator see, and the migration
 * of a reopened ticket verifiable by arithmetic.
 *
 * | ticket                | sector      | closed      | rating |
 * |-----------------------|-------------|-------------|--------|
 * | ratedInPeriod         | Secretaria  | 09-06 08:00 | 4      |
 * | ratedWithoutComment   | Secretaria  | 09-07 11:00 | 2      |
 * | ratedAtLowerBound     | Secretaria  | 09-01 00:00 | 3      |
 * | ratedAtUpperBound     | Secretaria  | 10-01 00:00 | 5      |
 * | ratedBeforePeriod     | Secretaria  | 08-20 10:00 | 1      |
 * | ratedAndReopened      | Secretaria  | —           | 5      |
 * | ratedInFinanceiro     | Financeiro  | 09-11 12:00 | 5      |
 * | ratedAfterTransfer    | Financeiro  | 08-25 08:00 | 4      |
 * | closedUnrated         | Secretaria  | 09-08 12:00 | —      |
 * | closedUnratedSpare    | Secretaria  | 09-09 12:00 | —      |
 * | closedOfOtherStudent  | Secretaria  | 09-10 12:00 | —      |
 * | openUnrated           | Secretaria  | —           | —      |
 */
export async function createRatingScenario(testApp: TestApp): Promise<RatingScenario> {
  const { prisma } = testApp;
  testApp.clock.set(RATING_NOW);
  const scenario = await createTicketScenario(testApp);

  const ratedInPeriod = await closedTicketOfStudent(prisma, scenario, {
    title: 'Encerrado e avaliado dentro do período',
    openedAt: at('2026-09-05T08:00:00.000Z'),
    closedAt: at('2026-09-06T08:00:00.000Z'),
    assigneeId: scenario.users.agent,
  });
  await createRating(prisma, {
    ticketId: ratedInPeriod.id,
    score: 4,
    comment: 'Atendimento rápido e cordial.\nObrigada.',
    ratedAt: at('2026-09-06T09:00:00.000Z'),
  });

  const ratedWithoutComment = await closedTicketOfStudent(prisma, scenario, {
    title: 'Encerrado e avaliado sem comentário',
    openedAt: at('2026-09-07T08:00:00.000Z'),
    closedAt: at('2026-09-07T11:00:00.000Z'),
  });
  await createRating(prisma, { ticketId: ratedWithoutComment.id, score: 2, comment: null });

  const ratedAtLowerBound = await closedTicketOfStudent(prisma, scenario, {
    title: 'Encerrado exatamente no limite inicial',
    openedAt: at('2026-08-31T22:00:00.000Z'),
    closedAt: at(PERIOD_FROM),
  });
  await createRating(prisma, { ticketId: ratedAtLowerBound.id, score: 3 });

  const ratedAtUpperBound = await closedTicketOfStudent(prisma, scenario, {
    title: 'Encerrado exatamente no limite final',
    openedAt: at('2026-09-30T20:00:00.000Z'),
    closedAt: at(PERIOD_TO),
  });
  await createRating(prisma, { ticketId: ratedAtUpperBound.id, score: 5 });

  const ratedBeforePeriod = await closedTicketOfStudent(prisma, scenario, {
    title: 'Encerrado antes do período',
    openedAt: at('2026-08-20T08:00:00.000Z'),
    closedAt: at('2026-08-20T10:00:00.000Z'),
  });
  await createRating(prisma, { ticketId: ratedBeforePeriod.id, score: 1 });

  // Rated while closed and then reopened: the rating stays and the closing instant is gone, so
  // the ticket leaves every average until it is closed again (BR2.4, BR3.1).
  const ratedAndReopened = await openTicketOfStudentInSecretaria(prisma, scenario, {
    title: 'Avaliado e depois reaberto',
    openedAt: at('2026-09-09T08:00:00.000Z'),
    updatedAt: at('2026-09-14T08:00:00.000Z'),
    closedAt: null,
  });
  await createRating(prisma, { ticketId: ratedAndReopened.id, score: 5 });

  const ratedInFinanceiro = await closedTicketOfStudent(prisma, scenario, {
    title: 'Encerrado e avaliado no Financeiro',
    openedAt: at('2026-09-11T08:00:00.000Z'),
    closedAt: at('2026-09-11T12:00:00.000Z'),
    sectorId: scenario.sectors.financeiro,
    categoryId: scenario.categories.boletos,
    assigneeId: scenario.users.financeAgent,
  });
  await createRating(prisma, { ticketId: ratedInFinanceiro.id, score: 5 });

  // Passed through Secretaria and closed in Financeiro, outside the period: it is the reader by
  // sector passage of BR1.3 without disturbing the numbers of the summary.
  const transferred = await ticketTransferredFromSecretariaToFinanceiro(prisma, scenario, {
    title: 'Transferido, encerrado e avaliado',
    openedAt: at('2026-08-24T08:00:00.000Z'),
  });
  const ratedAfterTransfer = await prisma.ticket.update({
    where: { id: transferred.id },
    data: {
      statusId: scenario.statuses.CLOSED,
      closedAt: at('2026-08-25T08:00:00.000Z'),
      updatedAt: at('2026-08-25T08:00:00.000Z'),
    },
  });
  await createRating(prisma, { ticketId: ratedAfterTransfer.id, score: 4 });

  const closedUnrated = await closedTicketOfStudent(prisma, scenario, {
    title: 'Encerrado e ainda não avaliado',
    openedAt: at('2026-09-08T08:00:00.000Z'),
    closedAt: at('2026-09-08T12:00:00.000Z'),
    assigneeId: scenario.users.agent,
  });

  const closedUnratedSpare = await closedTicketOfStudent(prisma, scenario, {
    title: 'Segundo encerrado e ainda não avaliado',
    openedAt: at('2026-09-09T09:00:00.000Z'),
    closedAt: at('2026-09-09T12:00:00.000Z'),
  });

  const closedOfOtherStudent = await closedTicketOfStudent(prisma, scenario, {
    title: 'Encerrado de outro solicitante',
    openedAt: at('2026-09-10T08:00:00.000Z'),
    closedAt: at('2026-09-10T12:00:00.000Z'),
    requesterId: scenario.users.otherStudent,
  });

  const openUnrated = await openTicketOfStudentInSecretaria(prisma, scenario, {
    title: 'Aberto, sem encerramento',
    openedAt: at('2026-09-12T08:00:00.000Z'),
  });

  return {
    ...scenario,
    tickets: {
      ratedInPeriod: ratedInPeriod.id,
      ratedWithoutComment: ratedWithoutComment.id,
      ratedAtLowerBound: ratedAtLowerBound.id,
      ratedAtUpperBound: ratedAtUpperBound.id,
      ratedBeforePeriod: ratedBeforePeriod.id,
      ratedAndReopened: ratedAndReopened.id,
      ratedInFinanceiro: ratedInFinanceiro.id,
      ratedAfterTransfer: ratedAfterTransfer.id,
      closedUnrated: closedUnrated.id,
      closedUnratedSpare: closedUnratedSpare.id,
      closedOfOtherStudent: closedOfOtherStudent.id,
      openUnrated: openUnrated.id,
    },
  };
}

/** The whole period, as the filter the rating summary receives; it cuts by the closing (BR3.1). */
export const CLOSING_PERIOD_FILTER = { closedFrom: PERIOD_FROM, closedTo: PERIOD_TO } as const;

/** Ratings the manager of Secretaria sees in the period: 4, 2 and 3. */
export const MANAGER_RATING_COUNT = 3;
export const MANAGER_AVERAGE_SCORE = (4 + 2 + 3) / 3;

/** The administrator also sees the ticket that never touched Secretaria, rated 5. */
export const ADMIN_RATING_COUNT = 4;
export const ADMIN_AVERAGE_SCORE = (4 + 2 + 3 + 5) / 4;

/** Closing the reopened ticket again inside the period brings its 5 back into the average. */
export const REOPENED_CLOSED_AGAIN_AT = '2026-09-20T08:00:00.000Z';
export const MANAGER_RATING_COUNT_AFTER_REOPEN = 4;
export const MANAGER_AVERAGE_SCORE_AFTER_REOPEN = (4 + 2 + 3 + 5) / 4;

/** Closes the reopened ticket again, the way an action of U2 would leave it (BR4.3 of U2). */
export function closeReopenedTicketAgain(
  prisma: PrismaService,
  scenario: RatingScenario,
): Promise<unknown> {
  const closedAt = at(REOPENED_CLOSED_AGAIN_AT);
  return prisma.ticket.update({
    where: { id: scenario.tickets.ratedAndReopened },
    data: { statusId: scenario.statuses.CLOSED, closedAt, updatedAt: closedAt },
  });
}
