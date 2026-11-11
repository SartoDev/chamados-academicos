import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { isForeignKeyViolation } from '../../../src/common/prisma/prisma-errors.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import { openTicketOfStudentInSecretaria } from '../u2-tickets/support/factories.js';
import { createTicketScenario, type TicketScenario } from '../u2-tickets/support/scenario.js';
import { createMessage, messageBodyOfLength, CONVERSATION_START } from './support/factories.js';

async function expectRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the operation to be rejected');
}

describe('U3 data model (real PostgreSQL)', () => {
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
    ticketId = (await openTicketOfStudentInSecretaria(testApp.prisma, scenario)).id;
  });

  describe('body length constraint (BR2.1)', () => {
    it('stores a body of exactly one character and one of exactly two thousand', async () => {
      const shortest = await createMessage(testApp.prisma, {
        ticketId,
        authorId: scenario.users.student,
        body: messageBodyOfLength(1),
      });
      const longest = await createMessage(testApp.prisma, {
        ticketId,
        authorId: scenario.users.student,
        body: messageBodyOfLength(2000),
      });

      expect(shortest.body).toHaveLength(1);
      expect(longest.body).toHaveLength(2000);
    });

    it('refuses an empty body and one made only of spaces', async () => {
      const empty = await expectRejection(
        createMessage(testApp.prisma, {
          ticketId,
          authorId: scenario.users.student,
          body: '',
        }),
      );
      const blank = await expectRejection(
        createMessage(testApp.prisma, {
          ticketId,
          authorId: scenario.users.student,
          body: '    \n  ',
        }),
      );

      expect(empty).toBeInstanceOf(Error);
      expect(blank).toBeInstanceOf(Error);
      expect(await testApp.prisma.message.count({ where: { ticketId } })).toBe(0);
    });

    it('refuses a body longer than two thousand characters', async () => {
      const error = await expectRejection(
        createMessage(testApp.prisma, {
          ticketId,
          authorId: scenario.users.student,
          body: messageBodyOfLength(2001),
        }),
      );

      expect(error).toBeInstanceOf(Error);
      expect(await testApp.prisma.message.count({ where: { ticketId } })).toBe(0);
    });

    it('keeps the line breaks of the stored body (BR2.1)', async () => {
      const body = 'Primeira linha.\nSegunda linha.\n\nQuarta linha.';

      const message = await createMessage(testApp.prisma, {
        ticketId,
        authorId: scenario.users.student,
        body,
      });

      expect(message.body).toBe(body);
    });
  });

  describe('foreign keys with ON DELETE RESTRICT', () => {
    it('refuses to delete a ticket that already has messages', async () => {
      await createMessage(testApp.prisma, { ticketId, authorId: scenario.users.student });

      const error = await expectRejection(
        testApp.prisma.ticket.delete({ where: { id: ticketId } }),
      );

      expect(isForeignKeyViolation(error)).toBe(true);
      expect(await testApp.prisma.message.count({ where: { ticketId } })).toBe(1);
    });

    it('refuses to delete the author of a message', async () => {
      await createMessage(testApp.prisma, { ticketId, authorId: scenario.users.agent });

      const error = await expectRejection(
        testApp.prisma.user.delete({ where: { id: scenario.users.agent } }),
      );

      expect(isForeignKeyViolation(error)).toBe(true);
    });

    it('refuses a message pointing at a ticket or an author that does not exist', async () => {
      const unknownId = '00000000-0000-4000-8000-000000000000';

      const withoutTicket = await expectRejection(
        createMessage(testApp.prisma, { ticketId: unknownId, authorId: scenario.users.student }),
      );
      const withoutAuthor = await expectRejection(
        createMessage(testApp.prisma, { ticketId, authorId: unknownId }),
      );

      expect(isForeignKeyViolation(withoutTicket)).toBe(true);
      expect(isForeignKeyViolation(withoutAuthor)).toBe(true);
    });
  });

  describe('reading order with the identifier tie-break (BR3.1, BR3.2)', () => {
    /** Three messages sharing one instant: only the identifier can order them. */
    async function storeMessagesAtTheSameInstant(): Promise<string[]> {
      const ids = [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
        '33333333-3333-4333-8333-333333333333',
      ];
      for (const id of [ids[2], ids[0], ids[1]]) {
        await createMessage(testApp.prisma, {
          id,
          ticketId,
          authorId: scenario.users.student,
          sentAt: CONVERSATION_START,
        });
      }
      return ids;
    }

    it('orders ascending by instant and, on a tie, by identifier', async () => {
      const ids = await storeMessagesAtTheSameInstant();
      await createMessage(testApp.prisma, {
        ticketId,
        authorId: scenario.users.student,
        sentAt: new Date(CONVERSATION_START.getTime() - 1000),
      });

      const rows = await testApp.prisma.message.findMany({
        where: { ticketId },
        orderBy: [{ sentAt: 'asc' }, { id: 'asc' }],
        select: { id: true },
      });

      expect(rows.slice(1).map((row) => row.id)).toEqual(ids);
    });

    it('orders descending by instant and, on a tie, by identifier, exactly reversing it', async () => {
      const ids = await storeMessagesAtTheSameInstant();

      const ascending = await testApp.prisma.message.findMany({
        where: { ticketId },
        orderBy: [{ sentAt: 'asc' }, { id: 'asc' }],
        select: { id: true },
      });
      const descending = await testApp.prisma.message.findMany({
        where: { ticketId },
        orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
        select: { id: true },
      });

      expect(ascending.map((row) => row.id)).toEqual(ids);
      expect(descending.map((row) => row.id)).toEqual([...ids].reverse());
    });

    it('keeps a message of another ticket out of the conversation', async () => {
      const otherTicket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      await createMessage(testApp.prisma, { ticketId, authorId: scenario.users.student });
      await createMessage(testApp.prisma, {
        ticketId: otherTicket.id,
        authorId: scenario.users.student,
      });

      const rows = await testApp.prisma.message.findMany({ where: { ticketId } });

      expect(rows).toHaveLength(1);
      expect(rows[0].ticketId).toBe(ticketId);
    });
  });
});
