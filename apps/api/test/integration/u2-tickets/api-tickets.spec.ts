import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { API, expectErrorEnvelope, http, sessionCookie } from '../u1-foundation/support/http.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import {
  closedTicketHoursAgo,
  ONE_HOUR_MS,
  openTicketOfStudentInSecretaria,
  ticketInAnalysisAssignedTo,
  ticketTransferredFromSecretariaToFinanceiro,
  ticketWaitingRequester,
} from './support/factories.js';
import { createTicketScenario, type TicketScenario } from './support/scenario.js';

const BASE_TIME = new Date('2026-09-10T12:00:00.000Z');
const JUSTIFICATION = 'Assunto financeiro, fora do alcance da Secretaria.';

describe('API-U2 tickets (US1.2, US1.3, US1.6, US2.1 to US2.4, US3.1)', () => {
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

  describe('opening a ticket (WF1)', () => {
    it('opens it with the derived sector and answers the detail (AC1.2.2, AC1.2.5)', async () => {
      const response = await http(testApp)
        .post(`${API}/tickets`)
        .set('Cookie', scenario.cookies.student)
        .send({
          categoryId: scenario.categories.documentos,
          title: 'Revisão de nota',
          description: 'Gostaria de solicitar a revisão da nota da P2.',
          // Discarded by the global pipe: the sector always comes from the category.
          sectorId: scenario.sectors.financeiro,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        reference: '#1',
        title: 'Revisão de nota',
        sector: { id: scenario.sectors.secretaria, name: 'Secretaria' },
        status: { key: 'OPEN', label: 'Aberto' },
        priority: { label: 'Normal' },
        requester: { id: scenario.users.student },
        assignee: null,
        assigneeUnavailable: false,
        closedAt: null,
      });
      expect(await testApp.prisma.ticket.count()).toBe(1);
    });

    it('refuses a title, a description or a justification outside the limits (BR1.2, Q3)', async () => {
      const shortTitle = await http(testApp)
        .post(`${API}/tickets`)
        .set('Cookie', scenario.cookies.student)
        .send({
          categoryId: scenario.categories.documentos,
          title: 'Nota',
          description: 'Descrição suficientemente longa para passar.',
        });
      const blank = await http(testApp)
        .post(`${API}/tickets`)
        .set('Cookie', scenario.cookies.professor)
        .send({ categoryId: scenario.categories.documentos, title: '   ', description: '  ' });

      const shortTitleError = expectErrorEnvelope(shortTitle, 400, 'VALIDATION_FAILED');
      expect(shortTitleError.details).toEqual(
        expect.arrayContaining([{ field: 'title', code: 'TOO_SHORT' }]),
      );
      const blankError = expectErrorEnvelope(blank, 400, 'VALIDATION_FAILED');
      expect(blankError.details).toEqual(
        expect.arrayContaining([
          { field: 'title', code: 'REQUIRED' },
          { field: 'description', code: 'REQUIRED' },
        ]),
      );
      expect(await testApp.prisma.ticket.count()).toBe(0);
    });

    it('refuses an unavailable category and an inactive priority (AC1.2.6, AC4.2.3)', async () => {
      const inactiveCategory = await http(testApp)
        .post(`${API}/tickets`)
        .set('Cookie', scenario.cookies.student)
        .send({
          categoryId: scenario.categories.retired,
          title: 'Categoria aposentada',
          description: 'Descrição suficientemente longa para passar.',
        });
      await testApp.prisma.priority.update({
        where: { id: scenario.priorities.baixa },
        data: { active: false },
      });
      const inactivePriority = await http(testApp)
        .post(`${API}/tickets`)
        .set('Cookie', scenario.cookies.student)
        .send({
          categoryId: scenario.categories.documentos,
          title: 'Prioridade inativa',
          description: 'Descrição suficientemente longa para passar.',
          priorityId: scenario.priorities.baixa,
        });

      expectErrorEnvelope(inactiveCategory, 422, 'CATALOG_ITEM_INACTIVE');
      expectErrorEnvelope(inactivePriority, 422, 'CATALOG_ITEM_INACTIVE');
    });
  });

  describe('listing tickets (WF2)', () => {
    it('lists the tickets of the requester with the page meta (AC1.3.1, AC1.3.7)', async () => {
      const mine = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        requesterId: scenario.users.otherStudent,
      });

      const response = await http(testApp)
        .get(`${API}/tickets`)
        .query({ view: 'requested' })
        .set('Cookie', scenario.cookies.student)
        .expect(200);

      expect(response.body).toMatchObject({ total: 1, page: 1, pageSize: 20 });
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0]).toMatchObject({
        id: mine.id,
        reference: `#${mine.number}`,
        requester: { id: scenario.users.student },
      });
    });

    it('offers the four slices of the sector queue (AC2.1.1, AC2.1.3)', async () => {
      const unassigned = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const mine = await ticketInAnalysisAssignedTo(testApp.prisma, scenario, scenario.users.agent);
      const passed = await ticketTransferredFromSecretariaToFinanceiro(testApp.prisma, scenario);

      const slices = await Promise.all(
        (['unassigned', 'mine', 'all', 'passed'] as const).map(async (queue) => {
          const response = await http(testApp)
            .get(`${API}/tickets`)
            .query({ view: 'queue', queue })
            .set('Cookie', scenario.cookies.agent)
            .expect(200);
          return [queue, response.body.items.map((item: { id: string }) => item.id).sort()];
        }),
      );

      expect(Object.fromEntries(slices)).toEqual({
        unassigned: [unassigned.id],
        mine: [mine.id],
        all: [mine.id, unassigned.id].sort(),
        passed: [passed.id],
      });
    });

    it('refuses an unknown value of view or of queue, and a bad page (BR2.5)', async () => {
      const badView = await http(testApp)
        .get(`${API}/tickets`)
        .query({ view: 'inbox' })
        .set('Cookie', scenario.cookies.student);
      const missingView = await http(testApp)
        .get(`${API}/tickets`)
        .set('Cookie', scenario.cookies.student);
      const badPage = await http(testApp)
        .get(`${API}/tickets`)
        .query({ view: 'requested', page: 0 })
        .set('Cookie', scenario.cookies.student);

      expect(expectErrorEnvelope(badView, 400, 'VALIDATION_FAILED').details).toEqual([
        { field: 'view', code: 'INVALID_VALUE' },
      ]);
      expectErrorEnvelope(missingView, 400, 'VALIDATION_FAILED');
      expect(expectErrorEnvelope(badPage, 400, 'VALIDATION_FAILED').details).toEqual([
        { field: 'page', code: 'OUT_OF_RANGE' },
      ]);
    });
  });

  describe('reading one ticket (BR2.4, BR2.7, BR2.8)', () => {
    it('answers the detail, the history and the passages of a visible ticket', async () => {
      const ticket = await ticketTransferredFromSecretariaToFinanceiro(testApp.prisma, scenario);
      await http(testApp)
        .post(`${API}/tickets/${ticket.id}/assume`)
        .set('Cookie', scenario.cookies.financeAgent)
        .expect(200);

      const detail = await http(testApp)
        .get(`${API}/tickets/${ticket.id}`)
        .set('Cookie', scenario.cookies.student)
        .expect(200);
      const history = await http(testApp)
        .get(`${API}/tickets/${ticket.id}/history`)
        .set('Cookie', scenario.cookies.student)
        .expect(200);
      const passages = await http(testApp)
        .get(`${API}/tickets/${ticket.id}/sector-passages`)
        .set('Cookie', scenario.cookies.student)
        .expect(200);

      expect(detail.body).toMatchObject({
        sector: { id: scenario.sectors.financeiro },
        assignee: { id: scenario.users.financeAgent, name: scenario.names.financeAgent },
      });
      expect(history.body.items).toMatchObject([
        { field: 'STATUS', previousValue: 'Aberto', newValue: 'Em análise' },
        { field: 'ASSIGNEE', previousValue: null, newValue: scenario.names.financeAgent },
      ]);
      expect(passages.body.items).toMatchObject([
        { sector: { name: 'Secretaria' }, justification: JUSTIFICATION },
        { sector: { name: 'Financeiro' }, leftAt: null },
      ]);
    });

    it('answers 404 with the same body for a ticket of another requester and an unknown one (AC5.2.2)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const unknownId = '00000000-0000-4000-8000-0000000000ab';

      const invisible = await http(testApp)
        .get(`${API}/tickets/${ticket.id}`)
        .set('Cookie', scenario.cookies.otherStudent);
      const missing = await http(testApp)
        .get(`${API}/tickets/${unknownId}`)
        .set('Cookie', scenario.cookies.otherStudent);

      expectErrorEnvelope(invisible, 404, 'TICKET_NOT_FOUND');
      expectErrorEnvelope(missing, 404, 'TICKET_NOT_FOUND');
      const withoutTrace = (body: { error: Record<string, unknown> }) => ({
        ...body.error,
        traceId: undefined,
      });
      expect(withoutTrace(invisible.body)).toEqual(withoutTrace(missing.body));
    });

    it('keeps history, passages and actions of an invisible ticket out of reach (AC5.1.2)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const cookie = scenario.cookies.otherStudent;

      for (const path of [`/history`, `/sector-passages`]) {
        expectErrorEnvelope(
          await http(testApp).get(`${API}/tickets/${ticket.id}${path}`).set('Cookie', cookie),
          404,
          'TICKET_NOT_FOUND',
        );
      }
      expectErrorEnvelope(
        await http(testApp).post(`${API}/tickets/${ticket.id}/close`).set('Cookie', cookie),
        404,
        'TICKET_NOT_FOUND',
      );
      expectErrorEnvelope(
        await http(testApp).post(`${API}/tickets/${ticket.id}/reopen`).set('Cookie', cookie),
        404,
        'TICKET_NOT_FOUND',
      );
      // The sector that never saw the ticket answers the same way (BR2.2).
      expectErrorEnvelope(
        await http(testApp)
          .get(`${API}/tickets/${ticket.id}`)
          .set('Cookie', scenario.cookies.financeAgent),
        404,
        'TICKET_NOT_FOUND',
      );
    });

    it('refuses an identifier that is not a UUID with a field code', async () => {
      const response = await http(testApp)
        .get(`${API}/tickets/nao-e-uuid`)
        .set('Cookie', scenario.cookies.student);

      expect(expectErrorEnvelope(response, 400, 'VALIDATION_FAILED').details).toEqual([
        { field: 'ticketId', code: 'INVALID_UUID' },
      ]);
    });
  });

  describe('actions of the attendance (WF3 to WF9)', () => {
    it('assumes, waits for the requester and closes, moving the status each time', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const assumed = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/assume`)
        .set('Cookie', scenario.cookies.agent)
        .expect(200);
      const waiting = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/wait-for-requester`)
        .set('Cookie', scenario.cookies.agent)
        .expect(200);
      const closed = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/close`)
        .set('Cookie', scenario.cookies.agent)
        .expect(200);

      expect(assumed.body).toMatchObject({
        status: { key: 'IN_ANALYSIS' },
        assignee: { id: scenario.users.agent },
      });
      expect(waiting.body.status.key).toBe('WAITING_REQUESTER');
      expect(closed.body).toMatchObject({ status: { key: 'CLOSED' } });
      expect(closed.body.closedAt).toBe(BASE_TIME.toISOString());
    });

    it('answers 409 with the current assignee when the ticket is already taken (AC2.2.2)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const response = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/assume`)
        .set('Cookie', scenario.cookies.otherAgent);

      const error = expectErrorEnvelope(response, 409, 'TICKET_ALREADY_ASSIGNED');
      expect(error.details).toEqual({
        assignee: { id: scenario.users.agent, name: scenario.names.agent },
      });
    });

    it('answers 409 for a transition outside the table (AC2.3.5)', async () => {
      const open = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        assigneeId: scenario.users.agent,
      });
      const closed = await closedTicketHoursAgo(testApp.prisma, scenario, 1, BASE_TIME);

      expectErrorEnvelope(
        await http(testApp)
          .post(`${API}/tickets/${open.id}/wait-for-requester`)
          .set('Cookie', scenario.cookies.agent),
        409,
        'TICKET_INVALID_TRANSITION',
      );
      expectErrorEnvelope(
        await http(testApp)
          .post(`${API}/tickets/${closed.id}/close`)
          .set('Cookie', scenario.cookies.student),
        409,
        'TICKET_INVALID_TRANSITION',
      );
    });

    it('assigns within the sector and refuses somebody from another one (AC3.1.1, AC3.1.2)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const assignable = await http(testApp)
        .get(`${API}/tickets/${ticket.id}/assignable-users`)
        .set('Cookie', scenario.cookies.manager)
        .expect(200);
      const assigned = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/assign`)
        .set('Cookie', scenario.cookies.manager)
        .send({ assigneeId: scenario.users.agent })
        .expect(200);
      const outsideSector = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/assign`)
        .set('Cookie', scenario.cookies.manager)
        .send({ assigneeId: scenario.users.financeAgent });

      expect(assignable.body.items.map((user: { id: string }) => user.id)).toEqual([
        scenario.users.agent,
        scenario.users.otherAgent,
        scenario.users.manager,
      ]);
      expect(assigned.body).toMatchObject({
        assignee: { id: scenario.users.agent },
        status: { key: 'IN_ANALYSIS' },
      });
      expectErrorEnvelope(outsideSector, 422, 'TICKET_ASSIGNEE_NOT_IN_SECTOR');
    });

    it('transfers with a justification and refuses the same sector (AC2.4.1, AC2.4.2)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const sameSector = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/transfer`)
        .set('Cookie', scenario.cookies.agent)
        .send({ targetSectorId: scenario.sectors.secretaria, justification: JUSTIFICATION });
      const shortJustification = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/transfer`)
        .set('Cookie', scenario.cookies.agent)
        .send({ targetSectorId: scenario.sectors.financeiro, justification: 'abc' });
      const transferred = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/transfer`)
        .set('Cookie', scenario.cookies.agent)
        .send({ targetSectorId: scenario.sectors.financeiro, justification: JUSTIFICATION })
        .expect(200);

      expectErrorEnvelope(sameSector, 422, 'TICKET_TRANSFER_SAME_SECTOR');
      expect(expectErrorEnvelope(shortJustification, 400, 'VALIDATION_FAILED').details).toEqual([
        { field: 'justification', code: 'TOO_SHORT' },
      ]);
      expect(transferred.body).toMatchObject({
        sector: { id: scenario.sectors.financeiro },
        status: { key: 'OPEN' },
        assignee: null,
      });
    });

    it('changes the priority and refuses an inactive one (AC2.3.3)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      await testApp.prisma.priority.update({
        where: { id: scenario.priorities.baixa },
        data: { active: false },
      });

      const changed = await http(testApp)
        .put(`${API}/tickets/${ticket.id}/priority`)
        .set('Cookie', scenario.cookies.agent)
        .send({ priorityId: scenario.priorities.alta })
        .expect(200);
      const inactive = await http(testApp)
        .put(`${API}/tickets/${ticket.id}/priority`)
        .set('Cookie', scenario.cookies.agent)
        .send({ priorityId: scenario.priorities.baixa });

      expect(changed.body.priority).toEqual({ id: scenario.priorities.alta, label: 'Alta' });
      expectErrorEnvelope(inactive, 422, 'CATALOG_ITEM_INACTIVE');
    });

    it('answers 403 TICKET_CLOSED for the attending actions on a closed ticket (AC2.4.6)', async () => {
      const closed = await closedTicketHoursAgo(testApp.prisma, scenario, 1, BASE_TIME);

      expectErrorEnvelope(
        await http(testApp)
          .post(`${API}/tickets/${closed.id}/assume`)
          .set('Cookie', scenario.cookies.agent),
        403,
        'TICKET_CLOSED',
      );
      expectErrorEnvelope(
        await http(testApp)
          .post(`${API}/tickets/${closed.id}/transfer`)
          .set('Cookie', scenario.cookies.agent)
          .send({ targetSectorId: scenario.sectors.financeiro, justification: JUSTIFICATION }),
        403,
        'TICKET_CLOSED',
      );
      expectErrorEnvelope(
        await http(testApp)
          .put(`${API}/tickets/${closed.id}/priority`)
          .set('Cookie', scenario.cookies.agent)
          .send({ priorityId: scenario.priorities.alta }),
        403,
        'TICKET_CLOSED',
      );
    });

    it('leaves a ticket seen only through a past passage in read-only (AC2.1.3, BR3.8)', async () => {
      const ticket = await ticketTransferredFromSecretariaToFinanceiro(testApp.prisma, scenario);

      await http(testApp)
        .get(`${API}/tickets/${ticket.id}`)
        .set('Cookie', scenario.cookies.agent)
        .expect(200);
      expectErrorEnvelope(
        await http(testApp)
          .post(`${API}/tickets/${ticket.id}/assume`)
          .set('Cookie', scenario.cookies.agent),
        403,
        'FORBIDDEN',
      );
      expectErrorEnvelope(
        await http(testApp)
          .post(`${API}/tickets/${ticket.id}/transfer`)
          .set('Cookie', scenario.cookies.manager)
          .send({ targetSectorId: scenario.sectors.secretaria, justification: JUSTIFICATION }),
        403,
        'FORBIDDEN',
      );
    });
  });

  describe('closing and reopening by the requester (US1.6)', () => {
    it('closes the own ticket and reopens it inside the window (AC1.6.1, AC1.6.7)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      await http(testApp)
        .post(`${API}/tickets/${ticket.id}/close`)
        .set('Cookie', scenario.cookies.student)
        .expect(200);
      testApp.clock.set(new Date(BASE_TIME.getTime() + 71 * ONE_HOUR_MS));
      // The session of U1 lasts 8 hours, so the requester signs in again before reopening.
      const laterCookie = sessionCookie(testApp, scenario.users.student);
      const reopened = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/reopen`)
        .set('Cookie', laterCookie)
        .expect(200);

      expect(reopened.body).toMatchObject({
        status: { key: 'OPEN' },
        closedAt: null,
        assignee: { id: scenario.users.agent },
      });
    });

    it('refuses the reopening exactly at 72 hours (AC1.6.2)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      await http(testApp)
        .post(`${API}/tickets/${ticket.id}/close`)
        .set('Cookie', scenario.cookies.student)
        .expect(200);

      // 71h59 after the closing: still inside the window, with a fresh session (BR1.5 of U1).
      testApp.clock.set(new Date(BASE_TIME.getTime() + 72 * ONE_HOUR_MS - 60_000));
      const insideCookie = sessionCookie(testApp, scenario.users.student);
      const justInside = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/reopen`)
        .set('Cookie', insideCookie)
        .expect(200);
      const closedAgain = new Date(BASE_TIME.getTime() + 72 * ONE_HOUR_MS - 60_000);
      await http(testApp)
        .post(`${API}/tickets/${ticket.id}/close`)
        .set('Cookie', insideCookie)
        .expect(200);
      // Exactly 72 hours after this second closing: outside the window (AC1.6.2).
      testApp.clock.set(new Date(closedAgain.getTime() + 72 * ONE_HOUR_MS));
      const outsideCookie = sessionCookie(testApp, scenario.users.student);
      const justOutside = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/reopen`)
        .set('Cookie', outsideCookie);

      expect(justInside.body.status.key).toBe('OPEN');
      expectErrorEnvelope(justOutside, 409, 'TICKET_REOPEN_WINDOW_EXPIRED');
    });
  });

  describe('automatic return by the requester message (WF10)', () => {
    it('is not an HTTP route of U2: only U3 calls it through the public service', async () => {
      const ticket = await ticketWaitingRequester(testApp.prisma, scenario, scenario.users.agent);

      const response = await http(testApp)
        .post(`${API}/tickets/${ticket.id}/requester-message`)
        .set('Cookie', scenario.cookies.student);

      expectErrorEnvelope(response, 404, 'NOT_FOUND');
    });
  });
});
