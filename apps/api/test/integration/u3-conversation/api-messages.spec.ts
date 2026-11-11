import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { API, expectErrorEnvelope, http } from '../u1-foundation/support/http.js';
import { createUser } from '../u1-foundation/support/factories.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import {
  closedTicketHoursAgo,
  openTicketOfStudentInSecretaria,
  ticketInAnalysisAssignedTo,
  ticketTransferredFromSecretariaToFinanceiro,
  ticketWaitingRequester,
} from '../u2-tickets/support/factories.js';
import { createTicketScenario, type TicketScenario } from '../u2-tickets/support/scenario.js';
import { createConversation, createMessage } from './support/factories.js';

const BASE_TIME = new Date('2026-09-10T12:00:00.000Z');
const UNKNOWN_TICKET_ID = '00000000-0000-4000-8000-0000000000e3';

const messagesPath = (ticketId: string) => `${API}/tickets/${ticketId}/messages`;

describe('API-U3 messages (WF1, WF2)', () => {
  let testApp: TestApp;
  let scenario: TicketScenario;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    testApp.clock.set(BASE_TIME);
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createTicketScenario(testApp);
  });

  describe('happy path of both operations', () => {
    it('sends a message and reads it back in the conversation (AC1.4.1)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const sent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Bom dia, alguma novidade?' });

      expect(sent.status).toBe(201);
      expect(sent.body).toEqual({
        id: expect.any(String),
        body: 'Bom dia, alguma novidade?',
        author: { id: scenario.users.student, name: scenario.names.student },
        sentAt: BASE_TIME.toISOString(),
      });

      const listed = await http(testApp)
        .get(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.agent);

      expect(listed.status).toBe(200);
      expect(listed.body).toEqual({
        items: [sent.body],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    });

    it('reads the conversation chronologically by default and reversed with order=desc', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      const stored = await createConversation(testApp.prisma, ticket.id, scenario.users.student, 4);
      const chronological = stored.map((message) => message.id);

      const ascending = await http(testApp)
        .get(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student);
      const descending = await http(testApp)
        .get(messagesPath(ticket.id))
        .query({ order: 'desc' })
        .set('Cookie', scenario.cookies.student);

      expect(ascending.body.items.map((item: { id: string }) => item.id)).toEqual(chronological);
      expect(descending.body.items.map((item: { id: string }) => item.id)).toEqual(
        [...chronological].reverse(),
      );
    });

    it('pages the conversation with the parameters of X-01', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      await createConversation(testApp.prisma, ticket.id, scenario.users.student, 5);

      const first = await http(testApp)
        .get(messagesPath(ticket.id))
        .query({ page: 1, pageSize: 2, order: 'desc' })
        .set('Cookie', scenario.cookies.student);
      const second = await http(testApp)
        .get(messagesPath(ticket.id))
        .query({ page: 2, pageSize: 2, order: 'desc' })
        .set('Cookie', scenario.cookies.student);

      expect(first.body).toMatchObject({ total: 5, page: 1, pageSize: 2 });
      expect(first.body.items).toHaveLength(2);
      expect(second.body.items).toHaveLength(2);
      const joined = [...first.body.items, ...second.body.items].map(
        (item: { id: string }) => item.id,
      );
      expect(new Set(joined).size).toBe(4);
    });

    it('refuses an invalid paging parameter and an unknown order (BR3.2)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const badPage = await http(testApp)
        .get(messagesPath(ticket.id))
        .query({ page: 0 })
        .set('Cookie', scenario.cookies.student);
      const badOrder = await http(testApp)
        .get(messagesPath(ticket.id))
        .query({ order: 'sideways' })
        .set('Cookie', scenario.cookies.student);

      expectErrorEnvelope(badPage, 400, 'VALIDATION_FAILED');
      expectErrorEnvelope(badOrder, 400, 'VALIDATION_FAILED');
    });

    it('offers no route to edit or delete a message (BR2.3, AC1.4.3)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      const message = await createMessage(testApp.prisma, {
        ticketId: ticket.id,
        authorId: scenario.users.student,
      });
      const origin = 'http://localhost:8080';

      const replaceCollection = await http(testApp)
        .put(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student)
        .set('Origin', origin)
        .send({ body: 'Reescrevendo.' });
      const editOne = await http(testApp)
        .patch(`${messagesPath(ticket.id)}/${message.id}`)
        .set('Cookie', scenario.cookies.student)
        .set('Origin', origin)
        .send({ body: 'Reescrevendo.' });
      const deleteOne = await http(testApp)
        .delete(`${messagesPath(ticket.id)}/${message.id}`)
        .set('Cookie', scenario.cookies.student)
        .set('Origin', origin);

      for (const response of [replaceCollection, editOne, deleteOne]) {
        expect(response.status).toBe(404);
      }
      expect(await testApp.prisma.message.count({ where: { ticketId: ticket.id } })).toBe(1);
      expect(
        await testApp.prisma.message.findUniqueOrThrow({ where: { id: message.id } }),
      ).toMatchObject({ body: message.body, sentAt: message.sentAt });
    });

    it('refuses an identifier that is not a UUID with the field code of X-01', async () => {
      const response = await http(testApp)
        .get(messagesPath('not-a-uuid'))
        .set('Cookie', scenario.cookies.student);

      const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
      expect(error.details).toEqual([{ field: 'ticketId', code: 'INVALID_UUID' }]);
    });
  });

  describe('session and access (BR1.1 to BR1.4, AC5.1.1, AC5.1.2)', () => {
    it('refuses both operations without a session (401)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const listed = await http(testApp).get(messagesPath(ticket.id));
      const sent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Sem sessão.' });

      expectErrorEnvelope(listed, 401, 'UNAUTHENTICATED');
      expectErrorEnvelope(sent, 401, 'UNAUTHENTICATED');
    });

    it('hides the conversation from the administrator (BR1.4, Q2)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      await createMessage(testApp.prisma, {
        ticketId: ticket.id,
        authorId: scenario.users.student,
      });

      const listed = await http(testApp)
        .get(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.admin);
      const sent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.admin)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Verificando o caso.' });
      const detail = await http(testApp)
        .get(`${API}/tickets/${ticket.id}`)
        .set('Cookie', scenario.cookies.admin);

      expectErrorEnvelope(listed, 404, 'TICKET_NOT_FOUND');
      expectErrorEnvelope(sent, 404, 'TICKET_NOT_FOUND');
      // The administrator keeps seeing the ticket itself, only the conversation is hidden.
      expect(detail.status).toBe(200);
    });

    it('hides the conversation from a sector the ticket never passed through (AC2.1.7)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const listed = await http(testApp)
        .get(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.financeAgent);

      expectErrorEnvelope(listed, 404, 'TICKET_NOT_FOUND');
    });

    it('hides the conversation of a ticket of another requester (AC5.1.2)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const listed = await http(testApp)
        .get(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.otherStudent);
      const sent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.otherStudent)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Oi, sou outro aluno.' });

      expectErrorEnvelope(listed, 404, 'TICKET_NOT_FOUND');
      expectErrorEnvelope(sent, 404, 'TICKET_NOT_FOUND');
    });

    it('answers a ticket that does not exist and one it may not see identically (AC5.2.2)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const missing = await http(testApp)
        .get(messagesPath(UNKNOWN_TICKET_ID))
        .set('Cookie', scenario.cookies.financeAgent);
      const invisible = await http(testApp)
        .get(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.financeAgent);
      // The administrator sees the ticket but not the conversation: a third source of the 404.
      const hiddenFromAdmin = await http(testApp)
        .get(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.admin);

      const withoutTrace = (body: { error: Record<string, unknown> }) => ({
        ...body.error,
        traceId: undefined,
      });
      expect(missing.status).toBe(404);
      expect(withoutTrace(invisible.body)).toEqual(withoutTrace(missing.body));
      expect(withoutTrace(hiddenFromAdmin.body)).toEqual(withoutTrace(missing.body));
    });

    it('lets a reader by sector passage read, and refuses the send with 403 (AC2.1.3)', async () => {
      const ticket = await ticketTransferredFromSecretariaToFinanceiro(testApp.prisma, scenario);
      await createMessage(testApp.prisma, {
        ticketId: ticket.id,
        authorId: scenario.users.student,
        body: 'Mensagem escrita enquanto estava na Secretaria.',
      });

      const listed = await http(testApp)
        .get(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.agent);
      const sent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.agent)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Complementando o que ficou pendente.' });
      const managerSent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.manager)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Acompanhando por aqui.' });

      expect(listed.status).toBe(200);
      expect(listed.body.total).toBe(1);
      expectErrorEnvelope(sent, 403, 'FORBIDDEN');
      expectErrorEnvelope(managerSent, 403, 'FORBIDDEN');
    });

    it('refuses the send of an agent of the sector who did not take the ticket (BR1.3, Q1)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const listed = await http(testApp)
        .get(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.otherAgent);
      const sent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.otherAgent)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Posso ajudar neste caso?' });

      expect(listed.status).toBe(200);
      expectErrorEnvelope(sent, 403, 'FORBIDDEN');
      expect(await testApp.prisma.message.count({ where: { ticketId: ticket.id } })).toBe(0);
    });

    it('lets the manager of the current sector write without taking the ticket (Q1)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const sent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.manager)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Assumo a resposta desta pendência.' });

      expect(sent.status).toBe(201);
      expect(sent.body.author).toEqual({
        id: scenario.users.manager,
        name: scenario.names.manager,
      });
      const ticketRow = await testApp.prisma.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        select: { assigneeId: true },
      });
      // Writing does not make the manager the assignee (assumption of functional-spec.md).
      expect(ticketRow.assigneeId).toBe(scenario.users.agent);
    });

    it('leaves only the requester writing on a ticket without an assignee (Q1)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const byAgent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.agent)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Vou verificar este pedido.' });
      const byRequester = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Fico no aguardo.' });

      expectErrorEnvelope(byAgent, 403, 'FORBIDDEN');
      expect(byRequester.status).toBe(201);
      // Nobody is notified: the ticket is already in the sector queue (BR4.3, Q4).
      expect(await testApp.prisma.notification.count({ where: { ticketId: ticket.id } })).toBe(0);
    });
  });

  describe('closed ticket (BR2.2, AC1.4.2, AC2.2.5)', () => {
    it('refuses the send with 409 and keeps the conversation readable', async () => {
      const ticket = await closedTicketHoursAgo(testApp.prisma, scenario, 1, BASE_TIME, {
        assigneeId: scenario.users.agent,
      });
      await createMessage(testApp.prisma, {
        ticketId: ticket.id,
        authorId: scenario.users.student,
      });

      const sent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Ainda tenho uma dúvida.' });
      const listed = await http(testApp)
        .get(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student);

      expectErrorEnvelope(sent, 409, 'MESSAGE_TICKET_CLOSED');
      expect(listed.status).toBe(200);
      expect(listed.body.total).toBe(1);
    });

    it('refuses the send of the assignee too, whatever the role (BR2.2)', async () => {
      const ticket = await closedTicketHoursAgo(testApp.prisma, scenario, 1, BASE_TIME, {
        assigneeId: scenario.users.agent,
      });

      const byAssignee = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.agent)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Complementando a resposta.' });

      expectErrorEnvelope(byAssignee, 409, 'MESSAGE_TICKET_CLOSED');
    });

    it('accepts the send again after the ticket is reopened (BR2.2)', async () => {
      const ticket = await closedTicketHoursAgo(testApp.prisma, scenario, 1, BASE_TIME, {
        assigneeId: scenario.users.agent,
      });

      const reopened = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/reopen`)
        .set('Cookie', scenario.cookies.student)
        .set('Origin', 'http://localhost:8080')
        .send();
      const sent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Reabri porque a dúvida continua.' });

      expect(reopened.status).toBe(200);
      expect(sent.status).toBe(201);
    });
  });

  describe('body validation (BR2.1, CT8)', () => {
    it('accepts a body of one character and one of two thousand', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const shortest = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'a' });
      const longest = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'b'.repeat(2000) });

      expect(shortest.status).toBe(201);
      expect(longest.status).toBe(201);
      expect(longest.body.body).toHaveLength(2000);
    });

    it('refuses a missing, blank or oversized body, naming the field', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const send = (body: unknown) =>
        http(testApp)
          .post(messagesPath(ticket.id))
          .set('Cookie', scenario.cookies.student)
          .set('Origin', 'http://localhost:8080')
          .send(body as object);

      const missing = await send({});
      const blank = await send({ body: '    ' });
      const tooLong = await send({ body: 'c'.repeat(2001) });

      for (const response of [missing, blank, tooLong]) {
        const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
        expect(error.details).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'body' })]),
        );
      }
      expect(await testApp.prisma.message.count({ where: { ticketId: ticket.id } })).toBe(0);
    });

    it('keeps the line breaks and does not interpret markup in the stored body', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const body = 'Primeira linha.\n<script>alert(1)</script>\n**negrito**';

      const sent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student)
        .set('Origin', 'http://localhost:8080')
        .send({ body });

      expect(sent.status).toBe(201);
      expect(sent.body.body).toBe(body);
    });
  });

  describe('automatic return to analysis and notifications (BR4.2, BR4.3, CT9)', () => {
    it('moves the ticket back to analysis and notifies the assignee once (AC2.3.2, AC1.5.1)', async () => {
      const ticket = await ticketWaitingRequester(testApp.prisma, scenario, scenario.users.agent);

      const sent = await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Segue o documento pedido.' });
      const detail = await http(testApp)
        .get(`${API}/tickets/${ticket.id}`)
        .set('Cookie', scenario.cookies.student);

      expect(sent.status).toBe(201);
      expect(detail.body.status.key).toBe('IN_ANALYSIS');
      const notifications = await testApp.prisma.notification.findMany({
        where: { ticketId: ticket.id },
        select: { recipientId: true, kind: true },
      });
      // One notice for the assignee and no second one for the status change (BR6.1 of U2).
      expect(notifications).toEqual([
        { recipientId: scenario.users.agent, kind: 'MESSAGE_RECEIVED' },
      ]);
    });

    it('records the status change in the history of the ticket, authored by the requester', async () => {
      const ticket = await ticketWaitingRequester(testApp.prisma, scenario, scenario.users.agent);

      await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Documento anexado ao sistema da secretaria.' });

      const history = await http(testApp)
        .get(`${API}/tickets/${ticket.id}/history`)
        .set('Cookie', scenario.cookies.student);

      expect(history.body.items).toEqual([
        expect.objectContaining({
          field: 'STATUS',
          newValue: 'Em análise',
          author: { id: scenario.users.student, name: scenario.names.student },
        }),
      ]);
    });

    it('never notifies the author of the message (BR4.3, CT9)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.agent)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Já estou verificando.' });

      const recipients = await testApp.prisma.notification.findMany({
        where: { ticketId: ticket.id },
        select: { recipientId: true },
      });
      expect(recipients.map((row) => row.recipientId)).toEqual([scenario.users.student]);
    });

    it('shows the conversation notice in the notifications of the recipient (AC1.5.1)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      await http(testApp)
        .post(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student)
        .set('Origin', 'http://localhost:8080')
        .send({ body: 'Tem alguma previsão?' });

      const bell = await http(testApp)
        .get(`${API}/notifications`)
        .set('Cookie', scenario.cookies.agent);

      expect(bell.body.items).toEqual([
        expect.objectContaining({ kind: 'MESSAGE_RECEIVED', read: false }),
      ]);
    });
  });

  describe('deactivated author (AC4.1.5)', () => {
    it('keeps the message readable with the name of the author who was deactivated', async () => {
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

      const listed = await http(testApp)
        .get(messagesPath(ticket.id))
        .set('Cookie', scenario.cookies.student);

      expect(listed.body.items[0].author).toEqual({
        id: retired.id,
        name: 'Atendente Aposentada',
      });
    });
  });
});
