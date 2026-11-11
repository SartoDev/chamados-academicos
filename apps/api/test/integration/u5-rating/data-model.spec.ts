import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import {
  isForeignKeyViolation,
  isUniqueConstraintViolation,
} from '../../../src/common/prisma/prisma-errors.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import { openTicketOfStudentInSecretaria } from '../u2-tickets/support/factories.js';
import { createTicketScenario, type TicketScenario } from '../u2-tickets/support/scenario.js';
import { closedTicketOfStudent, createRating, ratingCommentOfLength } from './support/factories.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

async function expectRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the operation to be rejected');
}

describe('U5 data model (real PostgreSQL)', () => {
  let testApp: TestApp;
  let scenario: TicketScenario;
  let ticketId: string;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createTicketScenario(testApp);
    ticketId = (
      await closedTicketOfStudent(testApp.prisma, scenario, {
        openedAt: new Date('2026-09-05T08:00:00.000Z'),
        closedAt: new Date('2026-09-06T08:00:00.000Z'),
      })
    ).id;
  });

  describe('score range constraint (BR2.1)', () => {
    it('stores the two ends of the scale, one and five', async () => {
      const otherTicket = await closedTicketOfStudent(testApp.prisma, scenario, {
        openedAt: new Date('2026-09-05T08:00:00.000Z'),
        closedAt: new Date('2026-09-06T08:00:00.000Z'),
      });

      const lowest = await createRating(testApp.prisma, { ticketId, score: 1 });
      const highest = await createRating(testApp.prisma, {
        ticketId: otherTicket.id,
        score: 5,
      });

      expect(lowest.score).toBe(1);
      expect(highest.score).toBe(5);
    });

    it('refuses a score below the scale and one above it', async () => {
      const tooLow = await expectRejection(createRating(testApp.prisma, { ticketId, score: 0 }));
      const tooHigh = await expectRejection(createRating(testApp.prisma, { ticketId, score: 6 }));

      expect(tooLow).toBeInstanceOf(Error);
      expect(tooHigh).toBeInstanceOf(Error);
      expect(await testApp.prisma.rating.count({ where: { ticketId } })).toBe(0);
    });
  });

  describe('comment length constraint (BR2.2)', () => {
    it('stores no comment, a comment of one character and one of exactly five hundred', async () => {
      const [second, third] = await Promise.all([
        closedTicketOfStudent(testApp.prisma, scenario, {
          openedAt: new Date('2026-09-05T08:00:00.000Z'),
          closedAt: new Date('2026-09-06T08:00:00.000Z'),
        }),
        closedTicketOfStudent(testApp.prisma, scenario, {
          openedAt: new Date('2026-09-05T08:00:00.000Z'),
          closedAt: new Date('2026-09-06T08:00:00.000Z'),
        }),
      ]);

      const absent = await createRating(testApp.prisma, { ticketId, comment: null });
      const shortest = await createRating(testApp.prisma, {
        ticketId: second.id,
        comment: ratingCommentOfLength(1),
      });
      const longest = await createRating(testApp.prisma, {
        ticketId: third.id,
        comment: ratingCommentOfLength(500),
      });

      expect(absent.comment).toBeNull();
      expect(shortest.comment).toHaveLength(1);
      expect(longest.comment).toHaveLength(500);
    });

    it('refuses a comment made only of blank space and one longer than five hundred', async () => {
      const blank = await expectRejection(
        createRating(testApp.prisma, { ticketId, comment: '   \n\t  ' }),
      );
      const tooLong = await expectRejection(
        createRating(testApp.prisma, { ticketId, comment: ratingCommentOfLength(501) }),
      );

      expect(blank).toBeInstanceOf(Error);
      expect(tooLong).toBeInstanceOf(Error);
      expect(await testApp.prisma.rating.count({ where: { ticketId } })).toBe(0);
    });

    it('keeps the line breaks of the stored comment (BR2.2)', async () => {
      const comment = 'Primeira linha.\nSegunda linha.\n\nQuarta linha.';

      const rating = await createRating(testApp.prisma, { ticketId, comment });

      expect(rating.comment).toBe(comment);
    });
  });

  describe('one rating per ticket (BR2.3)', () => {
    it('refuses a second rating of the same ticket, whatever the score', async () => {
      await createRating(testApp.prisma, { ticketId, score: 5 });

      const error = await expectRejection(createRating(testApp.prisma, { ticketId, score: 1 }));

      expect(isUniqueConstraintViolation(error)).toBe(true);
      const stored = await testApp.prisma.rating.findMany({ where: { ticketId } });
      expect(stored).toHaveLength(1);
      expect(stored[0]?.score).toBe(5);
    });

    it('accepts one rating for each of two different tickets', async () => {
      const otherTicket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      await createRating(testApp.prisma, { ticketId, score: 3 });
      await createRating(testApp.prisma, { ticketId: otherTicket.id, score: 4 });

      expect(await testApp.prisma.rating.count()).toBe(2);
    });
  });

  describe('foreign key with ON DELETE RESTRICT', () => {
    it('refuses to delete a ticket that was already rated', async () => {
      await createRating(testApp.prisma, { ticketId });

      const error = await expectRejection(
        testApp.prisma.ticket.delete({ where: { id: ticketId } }),
      );

      expect(isForeignKeyViolation(error)).toBe(true);
      expect(await testApp.prisma.rating.count({ where: { ticketId } })).toBe(1);
    });

    it('refuses a rating pointing at a ticket that does not exist', async () => {
      const error = await expectRejection(createRating(testApp.prisma, { ticketId: UNKNOWN_ID }));

      expect(isForeignKeyViolation(error)).toBe(true);
    });
  });
});
