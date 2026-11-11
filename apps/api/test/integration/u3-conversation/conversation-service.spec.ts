import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { ConversationService } from '../../../src/conversation/conversation.service.js';
import { FIRST_PAGE } from '../../../src/common/pagination.js';
import { NotificationsPublicService } from '../../../src/notifications/notifications-public.service.js';
import { expectDomainError } from '../../support/expect-domain-error.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createUser } from '../u1-foundation/support/factories.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import {
  closedTicketHoursAgo,
  openTicketOfStudentInSecretaria,
  ticketInAnalysisAssignedTo,
  ticketWaitingRequester,
} from '../u2-tickets/support/factories.js';
import { createTicketScenario, type TicketScenario } from '../u2-tickets/support/scenario.js';
import { createConversation, createMessage, CONVERSATION_START } from './support/factories.js';

const BASE_TIME = new Date('2026-09-10T12:00:00.000Z');

describe('ConversationService against PostgreSQL (WF1, WF2)', () => {
  let testApp: TestApp;
  let scenario: TicketScenario;
  let conversation: ConversationService;

  beforeAll(async () => {
    testApp = await createTestApp();
    conversation = testApp.app.get(ConversationService);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    testApp.clock.set(BASE_TIME);
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createTicketScenario(testApp);
  });

  describe('sendMessage (WF2, BR4.1 to BR4.3)', () => {
    it('stores the message, the status transition and the notification together (BR4.1)', async () => {
      const ticket = await ticketWaitingRequester(testApp.prisma, scenario, scenario.users.agent);

      const message = await conversation.sendMessage(scenario.actors.student, ticket.id, {
        body: '  Segue o documento pedido.  ',
      });

      expect(message).toEqual({
        id: expect.any(String),
        // Surrounding blank space removed before storing (BR2.1).
        body: 'Segue o documento pedido.',
        author: { id: scenario.users.student, name: scenario.names.student },
        sentAt: BASE_TIME.toISOString(),
      });
      const stored = await testApp.prisma.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        select: { statusId: true },
      });
      // BR4.2: U2 moved the ticket back to analysis inside the same transaction.
      expect(stored.statusId).toBe(scenario.statuses.IN_ANALYSIS);
      const notifications = await testApp.prisma.notification.findMany({
        where: { ticketId: ticket.id },
        select: { recipientId: true, kind: true },
      });
      expect(notifications).toEqual([
        { recipientId: scenario.users.agent, kind: 'MESSAGE_RECEIVED' },
      ]);
      // BR6.1 of U2: exactly one notice for the assignee, not one per aspect changed.
      expect(notifications).toHaveLength(1);
    });

    it('undoes the message and the transition when the notification record fails (BR4.1)', async () => {
      const failing = await createTestApp({
        customize: (builder) =>
          builder.overrideProvider(NotificationsPublicService).useValue({
            record: () => Promise.reject(new Error('forced failure after the message was stored')),
          }),
      });
      try {
        failing.clock.set(BASE_TIME);
        await resetToInitialLoad(failing.prisma, failing.seed);
        const failingScenario = await createTicketScenario(failing);
        const ticket = await ticketWaitingRequester(
          failing.prisma,
          failingScenario,
          failingScenario.users.agent,
        );

        await expect(
          failing.app
            .get(ConversationService)
            .sendMessage(failingScenario.actors.student, ticket.id, { body: 'Segue em anexo.' }),
        ).rejects.toThrow('forced failure after the message was stored');

        expect(await failing.prisma.message.count({ where: { ticketId: ticket.id } })).toBe(0);
        const untouched = await failing.prisma.ticket.findUniqueOrThrow({
          where: { id: ticket.id },
          select: { statusId: true },
        });
        expect(untouched.statusId).toBe(failingScenario.statuses.WAITING_REQUESTER);
        expect(
          await failing.prisma.ticketHistoryEntry.count({ where: { ticketId: ticket.id } }),
        ).toBe(0);
      } finally {
        await failing.close();
      }
    });

    it('keeps the status untouched when the attendance answers (BR4.2)', async () => {
      const ticket = await ticketWaitingRequester(testApp.prisma, scenario, scenario.users.agent);

      await conversation.sendMessage(scenario.actors.agent, ticket.id, {
        body: 'Aguardo o documento.',
      });

      const stored = await testApp.prisma.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        select: { statusId: true },
      });
      expect(stored.statusId).toBe(scenario.statuses.WAITING_REQUESTER);
      const notifications = await testApp.prisma.notification.findMany({
        where: { ticketId: ticket.id },
        select: { recipientId: true, kind: true },
      });
      expect(notifications).toEqual([
        { recipientId: scenario.users.student, kind: 'MESSAGE_RECEIVED' },
      ]);
    });

    it('tells the requester and the assignee when the sector manager answers (BR4.3)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      await conversation.sendMessage(scenario.actors.manager, ticket.id, {
        body: 'Estou acompanhando este caso.',
      });

      const recipients = await testApp.prisma.notification.findMany({
        where: { ticketId: ticket.id },
        select: { recipientId: true },
        orderBy: { recipientId: 'asc' },
      });
      expect(recipients.map((row) => row.recipientId).sort()).toEqual(
        [scenario.users.student, scenario.users.agent].sort(),
      );
    });

    it('refuses a send on a closed ticket and keeps the conversation readable (BR2.2)', async () => {
      const ticket = await closedTicketHoursAgo(testApp.prisma, scenario, 1, BASE_TIME, {
        assigneeId: scenario.users.agent,
      });
      await createMessage(testApp.prisma, {
        ticketId: ticket.id,
        authorId: scenario.users.student,
        body: 'Mensagem anterior ao encerramento.',
      });

      await expectDomainError(
        conversation.sendMessage(scenario.actors.student, ticket.id, { body: 'Mais uma dúvida.' }),
        'MESSAGE_TICKET_CLOSED',
      );

      const page = await conversation.listMessages(scenario.actors.student, ticket.id, FIRST_PAGE);
      expect(page.total).toBe(1);
      expect(await testApp.prisma.message.count({ where: { ticketId: ticket.id } })).toBe(1);
    });

    it('refuses the send of a reader who does not write, and hides it from the rest', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      await expectDomainError(
        conversation.sendMessage(scenario.actors.otherAgent, ticket.id, { body: 'Posso ajudar?' }),
        'FORBIDDEN',
      );
      await expectDomainError(
        conversation.sendMessage(scenario.actors.admin, ticket.id, { body: 'Verificando.' }),
        'TICKET_NOT_FOUND',
      );
      await expectDomainError(
        conversation.sendMessage(scenario.actors.otherStudent, ticket.id, { body: 'Oi.' }),
        'TICKET_NOT_FOUND',
      );

      expect(await testApp.prisma.message.count({ where: { ticketId: ticket.id } })).toBe(0);
    });

    it('refuses a body that is blank or longer than the limit (BR2.1)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const blank = await expectDomainError(
        conversation.sendMessage(scenario.actors.student, ticket.id, { body: '   \n  ' }),
        'VALIDATION_FAILED',
      );
      const tooLong = await expectDomainError(
        conversation.sendMessage(scenario.actors.student, ticket.id, { body: 'a'.repeat(2001) }),
        'VALIDATION_FAILED',
      );

      expect(blank.details).toEqual([{ field: 'body', code: 'REQUIRED' }]);
      expect(tooLong.details).toEqual([{ field: 'body', code: 'TOO_LONG' }]);
      expect(await testApp.prisma.message.count({ where: { ticketId: ticket.id } })).toBe(0);
    });

    it('accepts both ends of the allowed length (BR2.1)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const shortest = await conversation.sendMessage(scenario.actors.student, ticket.id, {
        body: 'a',
      });
      const longest = await conversation.sendMessage(scenario.actors.student, ticket.id, {
        body: 'b'.repeat(2000),
      });

      expect(shortest.body).toHaveLength(1);
      expect(longest.body).toHaveLength(2000);
    });
  });

  describe('listMessages (WF1, BR3.1 to BR3.3)', () => {
    it('reads in both orders, with the tie-break in the same direction (BR3.2)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      const stored = await createConversation(testApp.prisma, ticket.id, scenario.users.student, 5);
      const chronological = stored.map((message) => message.id);

      const ascending = await conversation.listMessages(
        scenario.actors.student,
        ticket.id,
        { page: 1, pageSize: 10 },
        'asc',
      );
      const descending = await conversation.listMessages(
        scenario.actors.student,
        ticket.id,
        { page: 1, pageSize: 10 },
        'desc',
      );

      expect(ascending.items.map((item) => item.id)).toEqual(chronological);
      expect(descending.items.map((item) => item.id)).toEqual([...chronological].reverse());
      expect(ascending.total).toBe(5);
    });

    it('pages a descending read so page two continues exactly where page one stopped', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      await createConversation(testApp.prisma, ticket.id, scenario.users.student, 7);

      const first = await conversation.listMessages(
        scenario.actors.student,
        ticket.id,
        { page: 1, pageSize: 3 },
        'desc',
      );
      const second = await conversation.listMessages(
        scenario.actors.student,
        ticket.id,
        { page: 2, pageSize: 3 },
        'desc',
      );
      const third = await conversation.listMessages(
        scenario.actors.student,
        ticket.id,
        { page: 3, pageSize: 3 },
        'desc',
      );

      const joined = [...first.items, ...second.items, ...third.items].map((item) => item.id);
      expect(new Set(joined).size).toBe(7);
      expect(first.total).toBe(7);
      expect(third.items).toHaveLength(1);
    });

    it('repeats but never loses a message stored between two pages (review finding R-06)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      const before = await createConversation(testApp.prisma, ticket.id, scenario.users.student, 6);

      const first = await conversation.listMessages(
        scenario.actors.student,
        ticket.id,
        { page: 1, pageSize: 3 },
        'desc',
      );
      // A message arrives while the reader looks at the first page: the offset window slides.
      const arrived = await createMessage(testApp.prisma, {
        ticketId: ticket.id,
        authorId: scenario.users.agent,
        body: 'Chegou enquanto você lia.',
        sentAt: new Date(CONVERSATION_START.getTime() + 60 * 60 * 1000),
      });
      const second = await conversation.listMessages(
        scenario.actors.student,
        ticket.id,
        { page: 2, pageSize: 3 },
        'desc',
      );
      const third = await conversation.listMessages(
        scenario.actors.student,
        ticket.id,
        { page: 3, pageSize: 3 },
        'desc',
      );

      const loaded = [...first.items, ...second.items, ...third.items].map((item) => item.id);
      const distinct = new Set(loaded);
      // The slide repeated a message the reader already had, which the join discards...
      expect(loaded.length).toBeGreaterThan(distinct.size);
      // ...and no message of the ticket was skipped by the three consecutive windows.
      expect(distinct).toEqual(new Set(before.map((message) => message.id)));
      expect(distinct.has(arrived.id)).toBe(false);
      // The message that arrived is reached by reloading the first page ("Atualizar", BR5.5).
      const refreshed = await conversation.listMessages(
        scenario.actors.student,
        ticket.id,
        { page: 1, pageSize: 3 },
        'desc',
      );
      expect(refreshed.items[0].id).toBe(arrived.id);
      expect(refreshed.total).toBe(7);
    });

    it('breaks a tie of instants by identifier, in the direction asked for (BR3.1)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      const ids = [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
        '33333333-3333-4333-8333-333333333333',
      ];
      for (const id of [ids[1], ids[2], ids[0]]) {
        await createMessage(testApp.prisma, {
          id,
          ticketId: ticket.id,
          authorId: scenario.users.student,
          sentAt: CONVERSATION_START,
        });
      }

      const ascending = await conversation.listMessages(
        scenario.actors.student,
        ticket.id,
        { page: 1, pageSize: 10 },
        'asc',
      );
      const descending = await conversation.listMessages(
        scenario.actors.student,
        ticket.id,
        { page: 1, pageSize: 10 },
        'desc',
      );

      expect(ascending.items.map((item) => item.id)).toEqual(ids);
      expect(descending.items.map((item) => item.id)).toEqual([...ids].reverse());
    });

    it('keeps the conversation readable with the name of a deactivated author (BR3.3, AC4.1.5)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      const retired = await createUser(testApp.prisma, {
        name: 'Atendente Aposentada',
        role: 'AGENT',
        sectorId: scenario.sectors.secretaria,
      });
      await createMessage(testApp.prisma, {
        ticketId: ticket.id,
        authorId: retired.id,
        body: 'Resposta de quem já saiu.',
      });
      await testApp.prisma.user.update({ where: { id: retired.id }, data: { active: false } });

      const page = await conversation.listMessages(scenario.actors.student, ticket.id, FIRST_PAGE);

      expect(page.items[0].author).toEqual({ id: retired.id, name: 'Atendente Aposentada' });
    });

    it('lets a reader by sector passage read, and hides the ticket from the rest (BR1.2)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      await createMessage(testApp.prisma, {
        ticketId: ticket.id,
        authorId: scenario.users.student,
      });

      const forSectorAgent = await conversation.listMessages(
        scenario.actors.otherAgent,
        ticket.id,
        FIRST_PAGE,
      );

      expect(forSectorAgent.total).toBe(1);
      await expectDomainError(
        conversation.listMessages(scenario.actors.admin, ticket.id, FIRST_PAGE),
        'TICKET_NOT_FOUND',
      );
      await expectDomainError(
        conversation.listMessages(scenario.actors.financeAgent, ticket.id, FIRST_PAGE),
        'TICKET_NOT_FOUND',
      );
    });

    it('answers an empty page for a ticket that has no message yet', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const page = await conversation.listMessages(scenario.actors.student, ticket.id, FIRST_PAGE);

      expect(page).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
    });
  });
});
