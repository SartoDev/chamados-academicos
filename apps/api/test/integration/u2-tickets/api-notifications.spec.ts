import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { API, expectErrorEnvelope, http } from '../u1-foundation/support/http.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import {
  createNotification,
  openTicketOfStudentInSecretaria,
  ticketInAnalysisAssignedTo,
} from './support/factories.js';
import { createTicketScenario, type TicketScenario } from './support/scenario.js';

const BASE_TIME = new Date('2026-09-10T12:00:00.000Z');
const JUSTIFICATION = 'Assunto financeiro, fora do alcance da Secretaria.';

describe('API-U2 notifications (US1.5, WF11)', () => {
  let testApp: TestApp;
  let scenario: TicketScenario;

  const unreadCountOf = async (cookie: string): Promise<number> => {
    const response = await http(testApp)
      .get(`${API}/notifications/unread-count`)
      .set('Cookie', cookie)
      .expect(200);
    return response.body.count as number;
  };

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

  it('records a notice for the requester when the attendance moves the ticket (AC1.5.1)', async () => {
    const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

    await http(testApp)
      .post(`${API}/tickets/${ticket.id}/assume`)
      .set('Cookie', scenario.cookies.agent)
      .expect(200);

    const list = await http(testApp)
      .get(`${API}/notifications`)
      .set('Cookie', scenario.cookies.student)
      .expect(200);
    expect(list.body.items).toMatchObject([
      {
        kind: 'ASSIGNEE_CHANGED',
        read: false,
        readAt: null,
        ticket: { id: ticket.id, reference: `#${ticket.number}`, title: ticket.title },
      },
    ]);
    // BR6.2: whoever caused the event is never notified of it.
    expect(await unreadCountOf(scenario.cookies.agent)).toBe(0);
    expect(await unreadCountOf(scenario.cookies.student)).toBe(1);
  });

  it('tells the assignee when the requester closes, and the requester when the sector changes', async () => {
    const closedByRequester = await ticketInAnalysisAssignedTo(
      testApp.prisma,
      scenario,
      scenario.users.agent,
    );
    const transferred = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

    await http(testApp)
      .post(`${API}/tickets/${closedByRequester.id}/close`)
      .set('Cookie', scenario.cookies.student)
      .expect(200);
    await http(testApp)
      .post(`${API}/tickets/${transferred.id}/transfer`)
      .set('Cookie', scenario.cookies.agent)
      .send({ targetSectorId: scenario.sectors.financeiro, justification: JUSTIFICATION })
      .expect(200);

    const forAgent = await http(testApp)
      .get(`${API}/notifications`)
      .set('Cookie', scenario.cookies.agent)
      .expect(200);
    const forStudent = await http(testApp)
      .get(`${API}/notifications`)
      .set('Cookie', scenario.cookies.student)
      .expect(200);
    expect(forAgent.body.items).toMatchObject([
      { kind: 'STATUS_CHANGED', ticket: { id: closedByRequester.id } },
    ]);
    expect(forStudent.body.items).toMatchObject([
      { kind: 'SECTOR_CHANGED', ticket: { id: transferred.id } },
    ]);
  });

  it('tells the last assignee about a reopening and never the requester who asked for it (AC1.6.3)', async () => {
    const ticket = await ticketInAnalysisAssignedTo(testApp.prisma, scenario, scenario.users.agent);
    await http(testApp)
      .post(`${API}/tickets/${ticket.id}/close`)
      .set('Cookie', scenario.cookies.agent)
      .expect(200);
    await testApp.prisma.notification.deleteMany({});

    await http(testApp)
      .post(`${API}/tickets/${ticket.id}/reopen`)
      .set('Cookie', scenario.cookies.student)
      .expect(200);

    const forAgent = await http(testApp)
      .get(`${API}/notifications`)
      .set('Cookie', scenario.cookies.agent)
      .expect(200);
    expect(forAgent.body.items).toMatchObject([{ kind: 'TICKET_REOPENED' }]);
    expect(await unreadCountOf(scenario.cookies.student)).toBe(0);
  });

  it('marks one notification as read and keeps the counter right (AC1.5.3)', async () => {
    const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
    const notification = await createNotification(testApp.prisma, {
      recipientId: scenario.users.student,
      ticketId: ticket.id,
    });
    await createNotification(testApp.prisma, {
      recipientId: scenario.users.student,
      ticketId: ticket.id,
    });

    await http(testApp)
      .post(`${API}/notifications/${notification.id}/read`)
      .set('Cookie', scenario.cookies.student)
      .expect(204);
    // Marking it again is idempotent (BR6.4).
    await http(testApp)
      .post(`${API}/notifications/${notification.id}/read`)
      .set('Cookie', scenario.cookies.student)
      .expect(204);

    expect(await unreadCountOf(scenario.cookies.student)).toBe(1);
    const stored = await testApp.prisma.notification.findUniqueOrThrow({
      where: { id: notification.id },
    });
    expect(stored).toMatchObject({ read: true });
    expect(stored.readAt?.toISOString()).toBe(BASE_TIME.toISOString());
  });

  it('marks every unread notification of the actor and zeroes the counter (AC1.5.4)', async () => {
    const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
    for (let index = 0; index < 3; index += 1) {
      await createNotification(testApp.prisma, {
        recipientId: scenario.users.student,
        ticketId: ticket.id,
      });
    }
    await createNotification(testApp.prisma, {
      recipientId: scenario.users.agent,
      ticketId: ticket.id,
    });

    await http(testApp)
      .post(`${API}/notifications/read-all`)
      .set('Cookie', scenario.cookies.student)
      .expect(204);

    expect(await unreadCountOf(scenario.cookies.student)).toBe(0);
    expect(await unreadCountOf(scenario.cookies.agent)).toBe(1);
  });

  it('filters the unread ones and pages the list (BR6.4)', async () => {
    const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
    await createNotification(testApp.prisma, {
      recipientId: scenario.users.student,
      ticketId: ticket.id,
      read: true,
    });
    await createNotification(testApp.prisma, {
      recipientId: scenario.users.student,
      ticketId: ticket.id,
    });

    const unreadOnly = await http(testApp)
      .get(`${API}/notifications`)
      .query({ unreadOnly: 'true' })
      .set('Cookie', scenario.cookies.student)
      .expect(200);
    const firstPage = await http(testApp)
      .get(`${API}/notifications`)
      .query({ page: 1, pageSize: 1 })
      .set('Cookie', scenario.cookies.student)
      .expect(200);
    const badFilter = await http(testApp)
      .get(`${API}/notifications`)
      .query({ unreadOnly: 'talvez' })
      .set('Cookie', scenario.cookies.student);

    expect(unreadOnly.body).toMatchObject({ total: 1 });
    expect(unreadOnly.body.items[0].read).toBe(false);
    expect(firstPage.body).toMatchObject({ total: 2, page: 1, pageSize: 1 });
    expect(firstPage.body.items).toHaveLength(1);
    expect(expectErrorEnvelope(badFilter, 400, 'VALIDATION_FAILED').details).toEqual([
      { field: 'unreadOnly', code: 'INVALID_BOOLEAN' },
    ]);
  });

  it('keeps a notification listed after the ticket leaves the sight of its recipient (BR6.5)', async () => {
    const ticket = await ticketInAnalysisAssignedTo(testApp.prisma, scenario, scenario.users.agent);
    await http(testApp)
      .post(`${API}/tickets/${ticket.id}/close`)
      .set('Cookie', scenario.cookies.student)
      .expect(200);

    // The agent keeps the notice; opening the ticket still follows the current visibility.
    const forAgent = await http(testApp)
      .get(`${API}/notifications`)
      .set('Cookie', scenario.cookies.agent)
      .expect(200);
    expect(forAgent.body.items).toHaveLength(1);
    await http(testApp)
      .get(`${API}/tickets/${ticket.id}`)
      .set('Cookie', scenario.cookies.agent)
      .expect(200);
    expectErrorEnvelope(
      await http(testApp)
        .get(`${API}/tickets/${ticket.id}`)
        .set('Cookie', scenario.cookies.financeAgent),
      404,
      'TICKET_NOT_FOUND',
    );
  });
});
