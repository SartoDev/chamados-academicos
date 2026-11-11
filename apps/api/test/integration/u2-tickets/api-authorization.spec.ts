import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Role } from '../../../src/common/roles.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { API, expectErrorEnvelope, http } from '../u1-foundation/support/http.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import { openTicketOfStudentInSecretaria, createNotification } from './support/factories.js';
import {
  createTicketScenario,
  type ScenarioUser,
  type TicketScenario,
} from './support/scenario.js';

const BASE_TIME = new Date('2026-09-10T12:00:00.000Z');
const ALL_ROLES: Role[] = ['STUDENT', 'PROFESSOR', 'AGENT', 'MANAGER', 'ADMIN'];
const JUSTIFICATION = 'Assunto financeiro, fora do alcance da Secretaria.';

/** One signed-in user per role, all of them able to see the ticket used by the matrix. */
const COOKIE_BY_ROLE: Record<Role, ScenarioUser> = {
  STUDENT: 'student',
  PROFESSOR: 'professor',
  AGENT: 'agent',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

interface Operation {
  id: string;
  method: 'get' | 'post' | 'put';
  path: (ticketId: string, notificationId: string) => string;
  query?: Record<string, string>;
  body?: (scenario: TicketScenario) => object;
  /** Roles the operation accepts; every other role must be refused with 403 (NFR2, BR2.9). */
  allowed: Role[];
}

const OPERATIONS: Operation[] = [
  {
    id: 'listTickets view=requested',
    method: 'get',
    path: () => '/tickets',
    query: { view: 'requested' },
    allowed: ['STUDENT', 'PROFESSOR'],
  },
  {
    id: 'listTickets view=queue',
    method: 'get',
    path: () => '/tickets',
    query: { view: 'queue' },
    allowed: ['AGENT', 'MANAGER'],
  },
  {
    id: 'listTickets view=all',
    method: 'get',
    path: () => '/tickets',
    query: { view: 'all' },
    allowed: ['ADMIN'],
  },
  {
    id: 'openTicket',
    method: 'post',
    path: () => '/tickets',
    body: (scenario) => ({
      categoryId: scenario.categories.documentos,
      title: 'Chamado da matriz de perfis',
      description: 'Descrição suficientemente longa para passar na validação.',
    }),
    allowed: ['STUDENT', 'PROFESSOR'],
  },
  {
    id: 'getTicket',
    method: 'get',
    path: (ticketId) => `/tickets/${ticketId}`,
    allowed: ALL_ROLES,
  },
  {
    id: 'listTicketHistory',
    method: 'get',
    path: (ticketId) => `/tickets/${ticketId}/history`,
    allowed: ALL_ROLES,
  },
  {
    id: 'listTicketSectorPassages',
    method: 'get',
    path: (ticketId) => `/tickets/${ticketId}/sector-passages`,
    allowed: ALL_ROLES,
  },
  {
    id: 'listAssignableUsers',
    method: 'get',
    path: (ticketId) => `/tickets/${ticketId}/assignable-users`,
    allowed: ['MANAGER'],
  },
  {
    id: 'assumeTicket',
    method: 'post',
    path: (ticketId) => `/tickets/${ticketId}/assume`,
    allowed: ['AGENT', 'MANAGER'],
  },
  {
    id: 'assignTicket',
    method: 'post',
    path: (ticketId) => `/tickets/${ticketId}/assign`,
    body: (scenario) => ({ assigneeId: scenario.users.agent }),
    allowed: ['MANAGER'],
  },
  {
    id: 'transferTicket',
    method: 'post',
    path: (ticketId) => `/tickets/${ticketId}/transfer`,
    body: (scenario) => ({
      targetSectorId: scenario.sectors.financeiro,
      justification: JUSTIFICATION,
    }),
    allowed: ['AGENT', 'MANAGER'],
  },
  {
    id: 'waitForRequester',
    method: 'post',
    path: (ticketId) => `/tickets/${ticketId}/wait-for-requester`,
    allowed: ['AGENT', 'MANAGER'],
  },
  {
    id: 'closeTicket',
    method: 'post',
    path: (ticketId) => `/tickets/${ticketId}/close`,
    allowed: ['STUDENT', 'PROFESSOR', 'AGENT', 'MANAGER'],
  },
  {
    id: 'reopenTicket',
    method: 'post',
    path: (ticketId) => `/tickets/${ticketId}/reopen`,
    allowed: ['STUDENT', 'PROFESSOR'],
  },
  {
    id: 'changeTicketPriority',
    method: 'put',
    path: (ticketId) => `/tickets/${ticketId}/priority`,
    body: (scenario) => ({ priorityId: scenario.priorities.alta }),
    allowed: ['AGENT', 'MANAGER'],
  },
  {
    id: 'listNotifications',
    method: 'get',
    path: () => '/notifications',
    allowed: ALL_ROLES,
  },
  {
    id: 'countUnreadNotifications',
    method: 'get',
    path: () => '/notifications/unread-count',
    allowed: ALL_ROLES,
  },
  {
    id: 'markAllNotificationsRead',
    method: 'post',
    path: () => '/notifications/read-all',
    allowed: ALL_ROLES,
  },
  {
    id: 'markNotificationRead',
    method: 'post',
    path: (_ticketId, notificationId) => `/notifications/${notificationId}/read`,
    allowed: ALL_ROLES,
  },
];

describe('API-U2 authorization (US5.1, US5.2, NFR2, BR2.9)', () => {
  let testApp: TestApp;
  let scenario: TicketScenario;
  let ticketId: string;
  let notificationId: string;

  function call(operation: Operation, cookie?: string) {
    const request = http(testApp)[operation.method](
      `${API}${operation.path(ticketId, notificationId)}`,
    );
    if (cookie) {
      request.set('Cookie', cookie);
    }
    if (operation.query) {
      request.query(operation.query);
    }
    return operation.body ? request.send(operation.body(scenario)) : request;
  }

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
    const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
    ticketId = ticket.id;
    notificationId = (
      await createNotification(testApp.prisma, {
        recipientId: scenario.users.student,
        ticketId: ticket.id,
      })
    ).id;
  });

  describe.each(OPERATIONS)('$id', (operation) => {
    const denied = ALL_ROLES.filter((role) => !operation.allowed.includes(role));

    it('answers 401 without a session (BR1.7 of U1)', async () => {
      expectErrorEnvelope(await call(operation), 401, 'UNAUTHENTICATED');
    });

    it(`answers 403 without any ticket data for ${denied.join(', ') || 'no role'}`, async () => {
      for (const role of denied) {
        const response = await call(operation, scenario.cookies[COOKIE_BY_ROLE[role]]);

        expect(response.status).toBe(403);
        expect(Object.keys(response.body as object)).toEqual(['error']);
        expect(response.body.error.code).toMatch(/^(FORBIDDEN|TICKET_[A-Z_]+)$/);
      }
    });
  });

  /**
   * The matrix above proves the refusals. That an allowed role gets through is proved per
   * operation, with the ticket in the state the rule expects: a permitted role that is not the
   * assignee, or works in another sector, is refused with 403 by design (BR2.9).
   */
  it('lets the manager of the sector perform every attending action (US3.1, Q7)', async () => {
    const forAssume = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
    const forPriority = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
    const forTransfer = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
    const cookie = scenario.cookies.manager;

    const assumed = await http(testApp)
      .post(`${API}/tickets/${forAssume.id}/assume`)
      .set('Cookie', cookie)
      .expect(200);
    const waiting = await http(testApp)
      .post(`${API}/tickets/${forAssume.id}/wait-for-requester`)
      .set('Cookie', cookie)
      .expect(200);
    const closed = await http(testApp)
      .post(`${API}/tickets/${forAssume.id}/close`)
      .set('Cookie', cookie)
      .expect(200);
    await http(testApp)
      .put(`${API}/tickets/${forPriority.id}/priority`)
      .set('Cookie', cookie)
      .send({ priorityId: scenario.priorities.alta })
      .expect(200);
    await http(testApp)
      .post(`${API}/tickets/${forTransfer.id}/transfer`)
      .set('Cookie', cookie)
      .send({ targetSectorId: scenario.sectors.financeiro, justification: JUSTIFICATION })
      .expect(200);
    await http(testApp)
      .get(`${API}/tickets`)
      .query({ view: 'queue', queue: 'all' })
      .set('Cookie', cookie)
      .expect(200);

    expect(assumed.body.assignee.id).toBe(scenario.users.manager);
    expect(waiting.body.status.key).toBe('WAITING_REQUESTER');
    expect(closed.body.status.key).toBe('CLOSED');
  });

  it('lets the professor open, close and reopen their own ticket (BR1.1, BR3.6, BR4.3)', async () => {
    const opened = await http(testApp)
      .post(`${API}/tickets`)
      .set('Cookie', scenario.cookies.professor)
      .send({
        categoryId: scenario.categories.documentos,
        title: 'Lançamento de notas',
        description: 'Preciso corrigir o lançamento de notas da turma.',
      })
      .expect(201);

    await http(testApp)
      .get(`${API}/tickets`)
      .query({ view: 'requested' })
      .set('Cookie', scenario.cookies.professor)
      .expect(200);
    await http(testApp)
      .post(`${API}/tickets/${opened.body.id}/close`)
      .set('Cookie', scenario.cookies.professor)
      .expect(200);
    const reopened = await http(testApp)
      .post(`${API}/tickets/${opened.body.id}/reopen`)
      .set('Cookie', scenario.cookies.professor)
      .expect(200);

    expect(reopened.body).toMatchObject({ status: { key: 'OPEN' }, closedAt: null });
  });

  it('lets the administrator read every ticket and refuses every action to them (BR2.3)', async () => {
    const inFinanceiro = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
      categoryId: scenario.categories.boletos,
      sectorId: scenario.sectors.financeiro,
    });

    await http(testApp)
      .get(`${API}/tickets/${inFinanceiro.id}`)
      .set('Cookie', scenario.cookies.admin)
      .expect(200);
    await http(testApp)
      .get(`${API}/tickets`)
      .query({ view: 'all' })
      .set('Cookie', scenario.cookies.admin)
      .expect(200);
    for (const action of ['assume', 'close', 'reopen', 'transfer']) {
      expectErrorEnvelope(
        await http(testApp)
          .post(`${API}/tickets/${inFinanceiro.id}/${action}`)
          .set('Cookie', scenario.cookies.admin)
          .send({ targetSectorId: scenario.sectors.secretaria, justification: JUSTIFICATION }),
        403,
        'FORBIDDEN',
      );
    }
  });

  it('never lets an agent act on the queue of another sector (BR2.2, BR3.8)', async () => {
    const inFinanceiro = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
      categoryId: scenario.categories.boletos,
      sectorId: scenario.sectors.financeiro,
    });

    expectErrorEnvelope(
      await http(testApp)
        .post(`${API}/tickets/${inFinanceiro.id}/assume`)
        .set('Cookie', scenario.cookies.agent),
      404,
      'TICKET_NOT_FOUND',
    );
    expectErrorEnvelope(
      await http(testApp)
        .get(`${API}/tickets/${inFinanceiro.id}/history`)
        .set('Cookie', scenario.cookies.agent),
      404,
      'TICKET_NOT_FOUND',
    );
  });

  it('never marks the notification of another user as read (AC5.1.2, BR6.4)', async () => {
    const ofAgent = await createNotification(testApp.prisma, {
      recipientId: scenario.users.agent,
      ticketId,
    });
    const unknownId = '00000000-0000-4000-8000-0000000000cd';

    const foreign = await http(testApp)
      .post(`${API}/notifications/${ofAgent.id}/read`)
      .set('Cookie', scenario.cookies.student);
    const missing = await http(testApp)
      .post(`${API}/notifications/${unknownId}/read`)
      .set('Cookie', scenario.cookies.student);

    expectErrorEnvelope(foreign, 404, 'NOTIFICATION_NOT_FOUND');
    expectErrorEnvelope(missing, 404, 'NOTIFICATION_NOT_FOUND');
    expect(
      (await testApp.prisma.notification.findUniqueOrThrow({ where: { id: ofAgent.id } })).read,
    ).toBe(false);
  });

  it('never lets a requester see the notifications of somebody else (BR6.4)', async () => {
    await createNotification(testApp.prisma, { recipientId: scenario.users.agent, ticketId });

    const list = await http(testApp)
      .get(`${API}/notifications`)
      .set('Cookie', scenario.cookies.student)
      .expect(200);

    expect(list.body.total).toBe(1);
    expect(list.body.items[0].id).toBe(notificationId);
  });
});
