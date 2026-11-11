import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import {
  isForeignKeyViolation,
  isUniqueConstraintViolation,
} from '../../../src/common/prisma/prisma-errors.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import {
  createHistoryEntry,
  createNotification,
  createSectorPassage,
  createTicket,
  openTicketOfStudentInSecretaria,
} from './support/factories.js';
import { createTicketScenario, type TicketScenario } from './support/scenario.js';

async function expectRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the operation to be rejected');
}

describe('U2 data model (real PostgreSQL)', () => {
  let testApp: TestApp;
  let scenario: TicketScenario;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createTicketScenario(testApp);
  });

  describe('visible identifier (BR1.6, BR7.4)', () => {
    it('gives distinct and increasing numbers to tickets opened at the same time', async () => {
      const openings = Array.from({ length: 5 }, () =>
        openTicketOfStudentInSecretaria(testApp.prisma, scenario),
      );

      const tickets = await Promise.all(openings);

      const numbers = tickets.map((ticket) => ticket.number);
      expect(new Set(numbers).size).toBe(numbers.length);
      expect(numbers.every((number) => Number.isInteger(number) && number > 0)).toBe(true);
      const ordered = await testApp.prisma.ticket.findMany({
        orderBy: { openedAt: 'asc' },
        select: { number: true },
      });
      expect([...numbers].sort((a, b) => a - b)).toEqual(
        ordered.map((row) => row.number).sort((a, b) => a - b),
      );
    });

    it('refuses to repeat a number already given to another ticket', async () => {
      const first = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const error = await expectRejection(
        openTicketOfStudentInSecretaria(testApp.prisma, scenario, { number: first.number }),
      );

      expect(isUniqueConstraintViolation(error)).toBe(true);
    });
  });

  describe('ticket text limits (BR1.2)', () => {
    it('refuses a title or a description outside the accepted length', async () => {
      const base = {
        requesterId: scenario.users.student,
        categoryId: scenario.categories.documentos,
        sectorId: scenario.sectors.secretaria,
        statusId: scenario.statuses.OPEN,
        priorityId: scenario.priorities.normal,
      };

      const shortTitle = await expectRejection(
        createTicket(testApp.prisma, { ...base, title: 'Nota' }),
      );
      const blankTitle = await expectRejection(
        createTicket(testApp.prisma, { ...base, title: '          ' }),
      );
      const shortDescription = await expectRejection(
        createTicket(testApp.prisma, { ...base, description: 'curta' }),
      );
      const accepted = await createTicket(testApp.prisma, {
        ...base,
        title: 'Notas',
        description: 'Dez caracteres exatos no mínimo.',
      });

      expect(shortTitle).toBeInstanceOf(Error);
      expect(blankTitle).toBeInstanceOf(Error);
      expect(shortDescription).toBeInstanceOf(Error);
      expect(accepted.title).toBe('Notas');
    });
  });

  describe('sector passages (BR5.2)', () => {
    it('refuses a passage that closes without justification or without author', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const leftAt = new Date('2026-09-02T12:00:00.000Z');

      const withoutJustification = await expectRejection(
        testApp.prisma.ticketSectorPassage.updateMany({
          where: { ticketId: ticket.id },
          data: { leftAt, transferredById: scenario.users.agent },
        }),
      );
      const withoutAuthor = await expectRejection(
        testApp.prisma.ticketSectorPassage.updateMany({
          where: { ticketId: ticket.id },
          data: { leftAt, justification: 'Assunto do Financeiro.' },
        }),
      );
      const justificationOnOpenPassage = await expectRejection(
        testApp.prisma.ticketSectorPassage.updateMany({
          where: { ticketId: ticket.id },
          data: { justification: 'Sem saída registrada.' },
        }),
      );

      expect(withoutJustification).toBeInstanceOf(Error);
      expect(withoutAuthor).toBeInstanceOf(Error);
      expect(justificationOnOpenPassage).toBeInstanceOf(Error);
    });

    it('refuses a justification shorter than the accepted length', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const error = await expectRejection(
        testApp.prisma.ticketSectorPassage.updateMany({
          where: { ticketId: ticket.id },
          data: {
            leftAt: new Date('2026-09-02T12:00:00.000Z'),
            justification: 'abc',
            transferredById: scenario.users.agent,
          },
        }),
      );

      expect(error).toBeInstanceOf(Error);
    });

    it('refuses a second open passage for the same ticket', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const error = await expectRejection(
        createSectorPassage(testApp.prisma, {
          ticketId: ticket.id,
          sectorId: scenario.sectors.financeiro,
          enteredAt: new Date('2026-09-02T12:00:00.000Z'),
        }),
      );

      expect(isUniqueConstraintViolation(error)).toBe(true);
      expect(
        await testApp.prisma.ticketSectorPassage.count({
          where: { ticketId: ticket.id, leftAt: null },
        }),
      ).toBe(1);
    });

    it('accepts a new open passage once the previous one is closed', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const leftAt = new Date('2026-09-02T12:00:00.000Z');

      await testApp.prisma.ticketSectorPassage.updateMany({
        where: { ticketId: ticket.id, leftAt: null },
        data: {
          leftAt,
          justification: 'Assunto do Financeiro.',
          transferredById: scenario.users.agent,
        },
      });
      const arrival = await createSectorPassage(testApp.prisma, {
        ticketId: ticket.id,
        sectorId: scenario.sectors.financeiro,
        enteredAt: leftAt,
      });

      expect(arrival.leftAt).toBeNull();
      expect(
        await testApp.prisma.ticketSectorPassage.count({ where: { ticketId: ticket.id } }),
      ).toBe(2);
    });
  });

  describe('history entries (BR5.1)', () => {
    it('keeps the justification on sector entries, and only on them', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const sectorWithoutJustification = await expectRejection(
        createHistoryEntry(testApp.prisma, {
          ticketId: ticket.id,
          field: 'SECTOR',
          authorId: scenario.users.agent,
          previousValue: scenario.sectors.secretaria,
          newValue: scenario.sectors.financeiro,
        }),
      );
      const statusWithJustification = await expectRejection(
        createHistoryEntry(testApp.prisma, {
          ticketId: ticket.id,
          field: 'STATUS',
          authorId: scenario.users.agent,
          previousValue: scenario.statuses.OPEN,
          newValue: scenario.statuses.IN_ANALYSIS,
          justification: 'Não pertence a uma mudança de status.',
        }),
      );
      const accepted = await createHistoryEntry(testApp.prisma, {
        ticketId: ticket.id,
        field: 'SECTOR',
        authorId: scenario.users.agent,
        previousValue: scenario.sectors.secretaria,
        newValue: scenario.sectors.financeiro,
        justification: 'Assunto do Financeiro.',
      });

      expect(sectorWithoutJustification).toBeInstanceOf(Error);
      expect(statusWithJustification).toBeInstanceOf(Error);
      expect(accepted.justification).toBe('Assunto do Financeiro.');
    });

    it('refuses an entry that records no change', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const bothEmpty = await expectRejection(
        createHistoryEntry(testApp.prisma, {
          ticketId: ticket.id,
          field: 'ASSIGNEE',
          authorId: scenario.users.manager,
        }),
      );
      const sameValue = await expectRejection(
        createHistoryEntry(testApp.prisma, {
          ticketId: ticket.id,
          field: 'PRIORITY',
          authorId: scenario.users.agent,
          previousValue: scenario.priorities.alta,
          newValue: scenario.priorities.alta,
        }),
      );
      const removal = await createHistoryEntry(testApp.prisma, {
        ticketId: ticket.id,
        field: 'ASSIGNEE',
        authorId: scenario.users.agent,
        previousValue: scenario.users.agent,
        newValue: null,
      });

      expect(bothEmpty).toBeInstanceOf(Error);
      expect(sameValue).toBeInstanceOf(Error);
      expect(removal.newValue).toBeNull();
    });
  });

  describe('notifications (SM3)', () => {
    it('refuses a read mark that disagrees with the read instant', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const readWithoutInstant = await expectRejection(
        testApp.prisma.notification.create({
          data: {
            recipientId: scenario.users.student,
            ticketId: ticket.id,
            kind: 'STATUS_CHANGED',
            read: true,
          },
        }),
      );
      const instantWithoutMark = await expectRejection(
        testApp.prisma.notification.create({
          data: {
            recipientId: scenario.users.student,
            ticketId: ticket.id,
            kind: 'STATUS_CHANGED',
            read: false,
            readAt: new Date('2026-09-02T12:00:00.000Z'),
          },
        }),
      );
      const unread = await createNotification(testApp.prisma, {
        recipientId: scenario.users.student,
        ticketId: ticket.id,
      });
      const read = await createNotification(testApp.prisma, {
        recipientId: scenario.users.student,
        ticketId: ticket.id,
        read: true,
      });

      expect(readWithoutInstant).toBeInstanceOf(Error);
      expect(instantWithoutMark).toBeInstanceOf(Error);
      expect(unread.readAt).toBeNull();
      expect(read.readAt).not.toBeNull();
    });
  });

  describe('foreign keys with ON DELETE RESTRICT', () => {
    it('refuses to delete a user, sector, category, status or priority a ticket points at', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        assigneeId: scenario.users.agent,
      });

      const requester = await expectRejection(
        testApp.prisma.user.delete({ where: { id: scenario.users.student } }),
      );
      const assignee = await expectRejection(
        testApp.prisma.user.delete({ where: { id: scenario.users.agent } }),
      );
      const sector = await expectRejection(
        testApp.prisma.sector.delete({ where: { id: scenario.sectors.secretaria } }),
      );
      const category = await expectRejection(
        testApp.prisma.category.delete({ where: { id: scenario.categories.documentos } }),
      );
      const status = await expectRejection(
        testApp.prisma.status.delete({ where: { id: scenario.statuses.OPEN } }),
      );
      const priority = await expectRejection(
        testApp.prisma.priority.delete({ where: { id: scenario.priorities.normal } }),
      );

      for (const error of [requester, assignee, sector, category, status, priority]) {
        expect(isForeignKeyViolation(error)).toBe(true);
      }
      expect(await testApp.prisma.ticket.findUnique({ where: { id: ticket.id } })).not.toBeNull();
    });

    it('refuses to delete a ticket that already has history, passages or notifications', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      await createHistoryEntry(testApp.prisma, {
        ticketId: ticket.id,
        field: 'STATUS',
        authorId: scenario.users.agent,
        previousValue: scenario.statuses.OPEN,
        newValue: scenario.statuses.IN_ANALYSIS,
      });
      await createNotification(testApp.prisma, {
        recipientId: scenario.users.student,
        ticketId: ticket.id,
      });

      const error = await expectRejection(
        testApp.prisma.ticket.delete({ where: { id: ticket.id } }),
      );

      expect(isForeignKeyViolation(error)).toBe(true);
    });
  });
});
