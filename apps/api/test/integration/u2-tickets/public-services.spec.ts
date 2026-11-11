import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { FIRST_PAGE } from '../../../src/common/pagination.js';
import { TransactionRunner } from '../../../src/common/prisma/transaction-runner.js';
import { NotificationsPublicService } from '../../../src/notifications/notifications-public.service.js';
import { TicketActionsService } from '../../../src/tickets/ticket-actions.service.js';
import { TicketsPublicService } from '../../../src/tickets/tickets-public.service.js';
import { UsersPublicService } from '../../../src/users/users-public.service.js';
import { expectDomainError } from '../../support/expect-domain-error.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import {
  openTicketOfStudentInSecretaria,
  ticketInAnalysisAssignedTo,
  ticketTransferredFromSecretariaToFinanceiro,
  ticketWaitingRequester,
} from './support/factories.js';
import { createTicketScenario, type TicketScenario } from './support/scenario.js';

const BASE_TIME = new Date('2026-09-10T12:00:00.000Z');
const UNKNOWN_ID = '00000000-0000-4000-8000-0000000000dd';

describe('public services of U2 against PostgreSQL (BR8.1 to BR8.5)', () => {
  let testApp: TestApp;
  let scenario: TicketScenario;
  let ticketsPublic: TicketsPublicService;
  let notificationsPublic: NotificationsPublicService;
  let usersPublic: UsersPublicService;
  let actions: TicketActionsService;
  let transactions: TransactionRunner;

  beforeAll(async () => {
    testApp = await createTestApp();
    ticketsPublic = testApp.app.get(TicketsPublicService);
    notificationsPublic = testApp.app.get(NotificationsPublicService);
    usersPublic = testApp.app.get(UsersPublicService);
    actions = testApp.app.get(TicketActionsService);
    transactions = testApp.app.get(TransactionRunner);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    testApp.clock.set(BASE_TIME);
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createTicketScenario(testApp);
  });

  describe('getVisibleTicket (BR8.1)', () => {
    it('gives the facts of the ticket to everyone who may see it', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const forRequester = await ticketsPublic.getVisibleTicket(scenario.actors.student, ticket.id);

      expect(forRequester).toEqual({
        id: ticket.id,
        reference: `#${ticket.number}`,
        requesterId: scenario.users.student,
        assigneeId: scenario.users.agent,
        sectorId: scenario.sectors.secretaria,
        passedSectorIds: [],
        statusKey: 'IN_ANALYSIS',
        closedAt: null,
      });
      expect((await ticketsPublic.getVisibleTicket(scenario.actors.agent, ticket.id)).id).toBe(
        ticket.id,
      );
      expect((await ticketsPublic.getVisibleTicket(scenario.actors.admin, ticket.id)).id).toBe(
        ticket.id,
      );
    });

    it('lists the sectors the ticket passed through before the current one', async () => {
      const ticket = await ticketTransferredFromSecretariaToFinanceiro(testApp.prisma, scenario);

      const visible = await ticketsPublic.getVisibleTicket(scenario.actors.agent, ticket.id);

      expect(visible.sectorId).toBe(scenario.sectors.financeiro);
      expect(visible.passedSectorIds).toEqual([scenario.sectors.secretaria]);
    });

    it('answers the same for an invisible ticket and for one that does not exist (BR2.4)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const invisible = await expectDomainError(
        ticketsPublic.getVisibleTicket(scenario.actors.otherStudent, ticket.id),
        'TICKET_NOT_FOUND',
      );
      const missing = await expectDomainError(
        ticketsPublic.getVisibleTicket(scenario.actors.otherStudent, UNKNOWN_ID),
        'TICKET_NOT_FOUND',
      );

      expect(invisible.message).toBe(missing.message);
      expect(invisible.details).toBe(missing.details);
      await expectDomainError(
        ticketsPublic.getVisibleTicket(scenario.actors.financeAgent, ticket.id),
        'TICKET_NOT_FOUND',
      );
    });
  });

  describe('onRequesterMessage (BR8.2, WF10)', () => {
    it('brings a waiting ticket back to analysis inside the transaction of U3', async () => {
      const ticket = await ticketWaitingRequester(testApp.prisma, scenario, scenario.users.agent);

      // U3 stores the message and calls the notice in the same operation.
      await transactions.run(async () => {
        await ticketsPublic.onRequesterMessage(scenario.actors.student, ticket.id);
      });

      const stored = await testApp.prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      expect(stored.statusId).toBe(scenario.statuses.IN_ANALYSIS);
      expect(
        await testApp.prisma.ticketHistoryEntry.findMany({ where: { ticketId: ticket.id } }),
      ).toMatchObject([
        {
          field: 'STATUS',
          previousValue: scenario.statuses.WAITING_REQUESTER,
          newValue: scenario.statuses.IN_ANALYSIS,
          authorId: scenario.users.student,
        },
      ]);
      // U3 records the message notification itself; the return records none (BR4.4).
      expect(await testApp.prisma.notification.count({ where: { ticketId: ticket.id } })).toBe(0);
    });

    it('does nothing in any other status or for anyone who is not the requester', async () => {
      const inAnalysis = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      const waiting = await ticketWaitingRequester(testApp.prisma, scenario, scenario.users.agent);

      await ticketsPublic.onRequesterMessage(scenario.actors.student, inAnalysis.id);
      await ticketsPublic.onRequesterMessage(scenario.actors.agent, waiting.id);

      expect(
        (await testApp.prisma.ticket.findUniqueOrThrow({ where: { id: inAnalysis.id } })).statusId,
      ).toBe(scenario.statuses.IN_ANALYSIS);
      expect(
        (await testApp.prisma.ticket.findUniqueOrThrow({ where: { id: waiting.id } })).statusId,
      ).toBe(scenario.statuses.WAITING_REQUESTER);
      expect(await testApp.prisma.ticketHistoryEntry.count()).toBe(0);
    });

    it('is undone together with the operation of U3 that called it', async () => {
      const ticket = await ticketWaitingRequester(testApp.prisma, scenario, scenario.users.agent);

      await expect(
        transactions.run(async () => {
          await ticketsPublic.onRequesterMessage(scenario.actors.student, ticket.id);
          throw new Error('forced failure after the message of U3');
        }),
      ).rejects.toThrow('forced failure after the message of U3');

      const stored = await testApp.prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      expect(stored.statusId).toBe(scenario.statuses.WAITING_REQUESTER);
      expect(
        await testApp.prisma.ticketHistoryEntry.count({ where: { ticketId: ticket.id } }),
      ).toBe(0);
    });
  });

  describe('searchTickets (BR8.3)', () => {
    it('applies the visibility of each role', async () => {
      const ofStudent = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const ofProfessorInFinanceiro = await openTicketOfStudentInSecretaria(
        testApp.prisma,
        scenario,
        {
          requesterId: scenario.users.professor,
          categoryId: scenario.categories.boletos,
          sectorId: scenario.sectors.financeiro,
        },
      );

      const forStudent = await ticketsPublic.searchTickets(scenario.actors.student, {}, FIRST_PAGE);
      const forAgent = await ticketsPublic.searchTickets(scenario.actors.agent, {}, FIRST_PAGE);
      const forAdmin = await ticketsPublic.searchTickets(scenario.actors.admin, {}, FIRST_PAGE);

      expect(forStudent.items.map((row) => row.id)).toEqual([ofStudent.id]);
      expect(forAgent.items.map((row) => row.id)).toEqual([ofStudent.id]);
      expect(forAdmin.total).toBe(2);
      expect(forAdmin.items.map((row) => row.id).sort()).toEqual(
        [ofStudent.id, ofProfessorInFinanceiro.id].sort(),
      );
      expect(forStudent.items[0]).toMatchObject({
        reference: `#${ofStudent.number}`,
        categoryId: scenario.categories.documentos,
        statusId: scenario.statuses.OPEN,
        assigneeId: null,
      });
    });

    it('combines the filters, including the opening period', async () => {
      const older = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        openedAt: new Date('2026-09-01T09:00:00.000Z'),
      });
      const newer = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        openedAt: new Date('2026-09-09T09:00:00.000Z'),
        statusId: scenario.statuses.CLOSED,
        closedAt: new Date('2026-09-09T10:00:00.000Z'),
      });

      const closedOnly = await ticketsPublic.searchTickets(
        scenario.actors.student,
        { statusId: scenario.statuses.CLOSED },
        FIRST_PAGE,
      );
      const openedInSeptemberFirstWeek = await ticketsPublic.searchTickets(
        scenario.actors.student,
        { openedFrom: '2026-09-01T00:00:00.000Z', openedTo: '2026-09-08T00:00:00.000Z' },
        FIRST_PAGE,
      );

      expect(closedOnly.items.map((row) => row.id)).toEqual([newer.id]);
      expect(openedInSeptemberFirstWeek.items.map((row) => row.id)).toEqual([older.id]);
    });

    it('refuses an instant it cannot read', async () => {
      await expectDomainError(
        ticketsPublic.searchTickets(scenario.actors.student, { openedFrom: 'ontem' }, FIRST_PAGE),
        'VALIDATION_FAILED',
      );
    });
  });

  describe('NotificationsPublicService.record (BR8.4)', () => {
    it('writes one notice per distinct recipient and ignores an empty list', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      await notificationsPublic.record({
        kind: 'MESSAGE_RECEIVED',
        ticketId: ticket.id,
        recipientIds: [scenario.users.agent, scenario.users.agent, scenario.users.student],
      });
      await notificationsPublic.record({
        kind: 'MESSAGE_RECEIVED',
        ticketId: ticket.id,
        recipientIds: [],
      });

      const stored = await testApp.prisma.notification.findMany({ where: { ticketId: ticket.id } });
      expect(stored).toHaveLength(2);
      expect(stored.every((notification) => notification.kind === 'MESSAGE_RECEIVED')).toBe(true);
      expect(stored.every((notification) => !notification.read)).toBe(true);
    });

    it('joins the transaction of the caller and is undone with it (BR6.3)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      await expect(
        transactions.run(async () => {
          await notificationsPublic.record({
            kind: 'MESSAGE_RECEIVED',
            ticketId: ticket.id,
            recipientIds: [scenario.users.agent],
          });
          throw new Error('forced failure after recording the notice');
        }),
      ).rejects.toThrow('forced failure after recording the notice');

      expect(await testApp.prisma.notification.count({ where: { ticketId: ticket.id } })).toBe(0);
    });

    it('refuses a kind outside the five of the contract', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      await expectDomainError(
        notificationsPublic.record({
          kind: 'SOMETHING_ELSE',
          ticketId: ticket.id,
          recipientIds: [scenario.users.agent],
        }),
        'INTERNAL_ERROR',
      );
    });
  });

  describe('UsersPublicService.findAssignableInSector (BR8.5, additive to SVC-01)', () => {
    it('returns the active agents and managers of the sector, by name', async () => {
      expect(await usersPublic.findAssignableInSector(scenario.sectors.financeiro)).toEqual([
        { id: scenario.users.financeAgent, name: scenario.names.financeAgent },
        { id: scenario.users.financeManager, name: scenario.names.financeManager },
      ]);
    });

    it('leaves out deactivated people, other roles, other sectors and unknown identifiers', async () => {
      await testApp.prisma.user.update({
        where: { id: scenario.users.agent },
        data: { active: false },
      });

      const assignable = await usersPublic.findAssignableInSector(scenario.sectors.secretaria);

      expect(assignable.map((user) => user.id)).toEqual([
        scenario.users.otherAgent,
        scenario.users.manager,
      ]);
      expect(await usersPublic.findAssignableInSector(UNKNOWN_ID)).toEqual([]);
      expect(await usersPublic.findAssignableInSector('não é um identificador')).toEqual([]);
    });

    it('reads the state written by the operation in progress (BR7.1)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      await transactions.run(async () => {
        await testApp.app
          .get(TransactionRunner)
          .db()
          .user.update({
            where: { id: scenario.users.manager },
            data: { active: false },
          });
        const assignable = await usersPublic.findAssignableInSector(scenario.sectors.secretaria);
        expect(assignable.map((user) => user.id)).toEqual([
          scenario.users.agent,
          scenario.users.otherAgent,
        ]);
        // The assignment sees the same state inside the operation.
        const detail = await actions.assign(
          scenario.actors.manager,
          ticket.id,
          scenario.users.agent,
        );
        expect(detail.assignee).toMatchObject({ id: scenario.users.agent });
      });
    });
  });
});
