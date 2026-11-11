import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { ReportingService } from '../../../src/reporting/reporting.service.js';
import { RatingService } from '../../../src/tickets/rating.service.js';
import { TicketActionsService } from '../../../src/tickets/ticket-actions.service.js';
import { expectDomainError } from '../../support/expect-domain-error.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import { openTicketOfStudentInSecretaria } from '../u2-tickets/support/factories.js';
import { ratingCommentOfLength } from './support/factories.js';
import {
  ADMIN_AVERAGE_SCORE,
  ADMIN_RATING_COUNT,
  closeReopenedTicketAgain,
  createRatingScenario,
  EMPTY_PERIOD_FROM,
  EMPTY_PERIOD_TO,
  MANAGER_AVERAGE_SCORE,
  MANAGER_AVERAGE_SCORE_AFTER_REOPEN,
  MANAGER_RATING_COUNT,
  MANAGER_RATING_COUNT_AFTER_REOPEN,
  PERIOD_FROM,
  PERIOD_TO,
  type RatingScenario,
} from './support/rating-scenario.js';

const PERIOD = { from: PERIOD_FROM, to: PERIOD_TO };
const EMPTY_PERIOD = { from: EMPTY_PERIOD_FROM, to: EMPTY_PERIOD_TO };

describe('RatingService against PostgreSQL (BR1.1 to BR3.3)', () => {
  let testApp: TestApp;
  let scenario: RatingScenario;
  let ratings: RatingService;
  let reporting: ReportingService;
  let actions: TicketActionsService;

  beforeAll(async () => {
    testApp = await createTestApp();
    ratings = testApp.app.get(RatingService);
    reporting = testApp.app.get(ReportingService);
    actions = testApp.app.get(TicketActionsService);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createRatingScenario(testApp);
  });

  describe('rateTicket (BR1.1, BR1.2, BR2.1 to BR2.3)', () => {
    it('stores the rating of the requester on a closed ticket, with the current instant', async () => {
      const ratedAt = new Date('2026-09-20T15:30:00.000Z');
      testApp.clock.set(ratedAt);

      const rating = await ratings.rateTicket(
        scenario.actors.student,
        scenario.tickets.closedUnrated,
        { score: 5, comment: '  Atendimento excelente.  ' },
      );

      expect(rating).toEqual({
        ticketId: scenario.tickets.closedUnrated,
        score: 5,
        // The surrounding blank space is removed before storing (BR2.2).
        comment: 'Atendimento excelente.',
        ratedAt: ratedAt.toISOString(),
      });
    });

    it('stores a rating without a comment and one whose comment is only blank space', async () => {
      const withoutComment = await ratings.rateTicket(
        scenario.actors.student,
        scenario.tickets.closedUnrated,
        { score: 3 },
      );
      const blankComment = await ratings.rateTicket(
        scenario.actors.student,
        scenario.tickets.closedUnratedSpare,
        { score: 4, comment: '   \n  ' },
      );

      expect(withoutComment.comment).toBeNull();
      expect(blankComment.comment).toBeNull();
    });

    it('refuses an agent, a manager and an administrator with FORBIDDEN (BR1.1)', async () => {
      for (const actor of [scenario.actors.agent, scenario.actors.manager, scenario.actors.admin]) {
        await expectDomainError(
          ratings.rateTicket(actor, scenario.tickets.closedUnrated, { score: 4 }),
          'FORBIDDEN',
        );
      }
      expect(
        await testApp.prisma.rating.count({ where: { ticketId: scenario.tickets.closedUnrated } }),
      ).toBe(0);
    });

    it('answers as if the ticket did not exist for a requester who is not its own (AC5.2.1)', async () => {
      await expectDomainError(
        ratings.rateTicket(scenario.actors.otherStudent, scenario.tickets.closedUnrated, {
          score: 4,
        }),
        'TICKET_NOT_FOUND',
      );
      // And the same code for a ticket of the other student read by our student.
      await expectDomainError(
        ratings.rateTicket(scenario.actors.student, scenario.tickets.closedOfOtherStudent, {
          score: 4,
        }),
        'TICKET_NOT_FOUND',
      );
    });

    it('refuses a ticket that is not closed (BR1.2)', async () => {
      await expectDomainError(
        ratings.rateTicket(scenario.actors.student, scenario.tickets.openUnrated, { score: 4 }),
        'RATING_TICKET_NOT_CLOSED',
      );
      expect(
        await testApp.prisma.rating.count({ where: { ticketId: scenario.tickets.openUnrated } }),
      ).toBe(0);
    });

    it('refuses a second rating, whatever the score, and keeps the first one (BR2.3)', async () => {
      await expectDomainError(
        ratings.rateTicket(scenario.actors.student, scenario.tickets.ratedInPeriod, { score: 1 }),
        'RATING_ALREADY_EXISTS',
      );

      const stored = await ratings.getRating(
        scenario.actors.student,
        scenario.tickets.ratedInPeriod,
      );
      expect(stored.score).toBe(4);
    });

    it('refuses a score outside the scale and a comment past the limit (BR2.1, BR2.2)', async () => {
      const outOfRange = await expectDomainError(
        ratings.rateTicket(scenario.actors.student, scenario.tickets.closedUnrated, { score: 6 }),
        'VALIDATION_FAILED',
      );
      const tooLong = await expectDomainError(
        ratings.rateTicket(scenario.actors.student, scenario.tickets.closedUnrated, {
          score: 4,
          comment: ratingCommentOfLength(501),
        }),
        'VALIDATION_FAILED',
      );

      expect(outOfRange.details).toEqual([{ field: 'score', code: 'OUT_OF_RANGE' }]);
      expect(tooLong.details).toEqual([{ field: 'comment', code: 'TOO_LONG' }]);
    });

    it('creates no notification for anybody (BR4.2)', async () => {
      const before = await testApp.prisma.notification.count();

      await ratings.rateTicket(scenario.actors.student, scenario.tickets.closedUnrated, {
        score: 5,
      });

      expect(await testApp.prisma.notification.count()).toBe(before);
    });
  });

  describe('getRating (BR1.3)', () => {
    it('answers the rating to the requester, with the comment and the instant', async () => {
      const rating = await ratings.getRating(
        scenario.actors.student,
        scenario.tickets.ratedInPeriod,
      );

      expect(rating.score).toBe(4);
      expect(rating.comment).toBe('Atendimento rápido e cordial.\nObrigada.');
      expect(rating.ratedAt).toBe('2026-09-06T09:00:00.000Z');
    });

    it('answers the rating to the current assignee and to an agent of the sector', async () => {
      const byAssignee = await ratings.getRating(
        scenario.actors.agent,
        scenario.tickets.ratedInPeriod,
      );
      const bySectorAgent = await ratings.getRating(
        scenario.actors.otherAgent,
        scenario.tickets.ratedInPeriod,
      );

      expect(byAssignee.score).toBe(4);
      expect(bySectorAgent.score).toBe(4);
    });

    it('answers the rating to an agent of a sector the ticket passed through (BR1.3)', async () => {
      const byPassageAgent = await ratings.getRating(
        scenario.actors.agent,
        scenario.tickets.ratedAfterTransfer,
      );

      expect(byPassageAgent.score).toBe(4);
    });

    it('answers the rating to the administrator, unlike the conversation of U3 (Q4)', async () => {
      const byAdmin = await ratings.getRating(
        scenario.actors.admin,
        scenario.tickets.ratedInFinanceiro,
      );

      expect(byAdmin.score).toBe(5);
    });

    it('answers as if the ticket did not exist for whoever may not see it (AC5.2.2)', async () => {
      await expectDomainError(
        ratings.getRating(scenario.actors.otherStudent, scenario.tickets.ratedInPeriod),
        'TICKET_NOT_FOUND',
      );
      await expectDomainError(
        ratings.getRating(scenario.actors.financeAgent, scenario.tickets.ratedInPeriod),
        'TICKET_NOT_FOUND',
      );
    });

    it('answers RATING_NOT_FOUND on a visible ticket that has no rating yet', async () => {
      await expectDomainError(
        ratings.getRating(scenario.actors.student, scenario.tickets.closedUnrated),
        'RATING_NOT_FOUND',
      );
      await expectDomainError(
        ratings.getRating(scenario.actors.agent, scenario.tickets.openUnrated),
        'RATING_NOT_FOUND',
      );
    });
  });

  describe('a rated ticket that was reopened (BR2.4, BR3.1)', () => {
    it('keeps the rating and still refuses a second one after the new closing', async () => {
      const before = await ratings.getRating(
        scenario.actors.student,
        scenario.tickets.ratedAndReopened,
      );
      await closeReopenedTicketAgain(testApp.prisma, scenario);

      const after = await ratings.getRating(
        scenario.actors.student,
        scenario.tickets.ratedAndReopened,
      );

      expect(after).toEqual(before);
      await expectDomainError(
        ratings.rateTicket(scenario.actors.student, scenario.tickets.ratedAndReopened, {
          score: 1,
        }),
        'RATING_ALREADY_EXISTS',
      );
    });

    it('leaves every average while it is open and comes back in the period of the new closing', async () => {
      const whileOpen = await reporting.getRatingSummary(scenario.actors.manager, PERIOD);

      await closeReopenedTicketAgain(testApp.prisma, scenario);
      const afterClosing = await reporting.getRatingSummary(scenario.actors.manager, PERIOD);

      expect(whileOpen.count).toBe(MANAGER_RATING_COUNT);
      expect(afterClosing.count).toBe(MANAGER_RATING_COUNT_AFTER_REOPEN);
      expect(afterClosing.averageScore).toBeCloseTo(MANAGER_AVERAGE_SCORE_AFTER_REOPEN, 6);
    });
  });

  describe('getRatingSummary (BR3.1 to BR3.3)', () => {
    it('averages and counts only what the manager of Secretaria may see', async () => {
      const summary = await reporting.getRatingSummary(scenario.actors.manager, PERIOD);

      expect(summary.count).toBe(MANAGER_RATING_COUNT);
      expect(summary.averageScore).toBeCloseTo(MANAGER_AVERAGE_SCORE, 6);
      expect(summary).toMatchObject({ from: PERIOD_FROM, to: PERIOD_TO });
    });

    it('adds, for the administrator, the ticket that never touched Secretaria', async () => {
      const summary = await reporting.getRatingSummary(scenario.actors.admin, PERIOD);

      expect(summary.count).toBe(ADMIN_RATING_COUNT);
      expect(summary.averageScore).toBeCloseTo(ADMIN_AVERAGE_SCORE, 6);
      expect(summary.count).toBeGreaterThan(MANAGER_RATING_COUNT);
    });

    it('includes the closing at the start of the period and excludes the one at its end', async () => {
      const summary = await reporting.getRatingSummary(scenario.actors.admin, PERIOD);
      const wider = await reporting.getRatingSummary(scenario.actors.admin, {
        from: PERIOD_FROM,
        to: '2026-10-01T00:00:00.001Z',
      });

      // The ticket closed exactly at the end enters only once the window moves past it.
      expect(wider.count).toBe(summary.count + 1);
    });

    it('answers an empty average and a zero count for a period without ratings (BR3.2)', async () => {
      const summary = await reporting.getRatingSummary(scenario.actors.manager, EMPTY_PERIOD);

      expect(summary).toEqual({
        averageScore: null,
        count: 0,
        from: EMPTY_PERIOD_FROM,
        to: EMPTY_PERIOD_TO,
      });
    });

    it('answers only the average, the count and the period — never a comment (BR3.3)', async () => {
      const summary = await reporting.getRatingSummary(scenario.actors.manager, PERIOD);

      expect(Object.keys(summary).sort()).toEqual(['averageScore', 'count', 'from', 'to']);
      expect(JSON.stringify(summary)).not.toContain('Atendimento');
    });

    it('gives a manager without a sector no rating at all (BR1.3 of U4)', async () => {
      const summary = await reporting.getRatingSummary(
        { ...scenario.actors.manager, sectorId: null },
        PERIOD,
      );

      expect(summary).toMatchObject({ averageScore: null, count: 0 });
    });
  });

  describe('rating is optional and blocks nothing (BR1.4)', () => {
    it('closes a ticket that was never rated exactly like one that was already rated', async () => {
      const unrated = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        title: 'Será encerrado sem avaliação',
        openedAt: new Date('2026-09-15T08:00:00.000Z'),
      });
      const rated = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        title: 'Será encerrado já avaliado',
        openedAt: new Date('2026-09-15T08:00:00.000Z'),
      });
      await testApp.prisma.rating.create({ data: { ticketId: rated.id, score: 4 } });

      const closedUnrated = await actions.close(scenario.actors.student, unrated.id);
      const closedRated = await actions.close(scenario.actors.student, rated.id);

      expect(closedUnrated.status.key).toBe('CLOSED');
      expect(closedRated.status.key).toBe('CLOSED');
      expect(closedUnrated.closedAt).toBe(closedRated.closedAt);
    });

    it('never changes the counts of the panel, rated or not', async () => {
      const before = await reporting.getTicketCounts(scenario.actors.manager, 'status', PERIOD);

      await ratings.rateTicket(scenario.actors.student, scenario.tickets.closedUnrated, {
        score: 2,
      });
      const after = await reporting.getTicketCounts(scenario.actors.manager, 'status', PERIOD);

      expect(after).toEqual(before);
    });
  });
});
