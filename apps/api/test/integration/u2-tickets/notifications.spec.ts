import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { FIRST_PAGE } from '../../../src/common/pagination.js';
import { NotificationsService } from '../../../src/notifications/notifications.service.js';
import { expectDomainError } from '../../support/expect-domain-error.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import { createNotification, openTicketOfStudentInSecretaria } from './support/factories.js';
import { createTicketScenario, type TicketScenario } from './support/scenario.js';

const BASE_TIME = new Date('2026-09-10T12:00:00.000Z');
const UNKNOWN_ID = '00000000-0000-4000-8000-0000000000cc';

describe('notifications of the actor against PostgreSQL (WF11, BR6.4)', () => {
  let testApp: TestApp;
  let scenario: TicketScenario;
  let notifications: NotificationsService;
  let ticketId: string;
  let ticketNumber: number;

  beforeAll(async () => {
    testApp = await createTestApp();
    notifications = testApp.app.get(NotificationsService);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    testApp.clock.set(BASE_TIME);
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createTicketScenario(testApp);
    const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
      title: 'Revisão de nota',
    });
    ticketId = ticket.id;
    ticketNumber = ticket.number;
  });

  it('lists only the notifications of the actor, newest first, with the ticket reference', async () => {
    await createNotification(testApp.prisma, {
      recipientId: scenario.users.student,
      ticketId,
      kind: 'STATUS_CHANGED',
      createdAt: new Date('2026-09-09T10:00:00.000Z'),
    });
    await createNotification(testApp.prisma, {
      recipientId: scenario.users.student,
      ticketId,
      kind: 'ASSIGNEE_CHANGED',
      createdAt: new Date('2026-09-10T10:00:00.000Z'),
    });
    await createNotification(testApp.prisma, {
      recipientId: scenario.users.agent,
      ticketId,
      kind: 'MESSAGE_RECEIVED',
    });

    const page = await notifications.list(scenario.actors.student, {}, FIRST_PAGE);

    expect(page.total).toBe(2);
    expect(page.items).toMatchObject([
      {
        kind: 'ASSIGNEE_CHANGED',
        read: false,
        readAt: null,
        ticket: { id: ticketId, reference: `#${ticketNumber}`, title: 'Revisão de nota' },
      },
      { kind: 'STATUS_CHANGED' },
    ]);
  });

  it('filters the unread ones and counts them for the bell (AC1.5.2)', async () => {
    await createNotification(testApp.prisma, { recipientId: scenario.users.student, ticketId });
    await createNotification(testApp.prisma, {
      recipientId: scenario.users.student,
      ticketId,
      read: true,
    });
    await createNotification(testApp.prisma, { recipientId: scenario.users.agent, ticketId });

    const unread = await notifications.list(
      scenario.actors.student,
      { unreadOnly: true },
      FIRST_PAGE,
    );

    expect(unread.total).toBe(1);
    expect(unread.items[0]?.read).toBe(false);
    expect(await notifications.countUnread(scenario.actors.student)).toEqual({ count: 1 });
    expect(await notifications.countUnread(scenario.actors.agent)).toEqual({ count: 1 });
    expect(await notifications.countUnread(scenario.actors.manager)).toEqual({ count: 0 });
  });

  it('marks one as read with the instant of the clock, and repeating it changes nothing', async () => {
    const notification = await createNotification(testApp.prisma, {
      recipientId: scenario.users.student,
      ticketId,
    });

    await notifications.markRead(scenario.actors.student, notification.id);
    const afterFirst = await testApp.prisma.notification.findUniqueOrThrow({
      where: { id: notification.id },
    });
    testApp.clock.set(new Date('2026-09-11T12:00:00.000Z'));
    await notifications.markRead(scenario.actors.student, notification.id);

    const afterSecond = await testApp.prisma.notification.findUniqueOrThrow({
      where: { id: notification.id },
    });
    expect(afterFirst).toMatchObject({ read: true });
    expect(afterFirst.readAt?.toISOString()).toBe(BASE_TIME.toISOString());
    expect(afterSecond.readAt?.toISOString()).toBe(BASE_TIME.toISOString());
    expect(await notifications.countUnread(scenario.actors.student)).toEqual({ count: 0 });
  });

  it('answers as not found for a notification of somebody else or one that does not exist', async () => {
    const ofAgent = await createNotification(testApp.prisma, {
      recipientId: scenario.users.agent,
      ticketId,
    });

    const foreign = await expectDomainError(
      notifications.markRead(scenario.actors.student, ofAgent.id),
      'NOTIFICATION_NOT_FOUND',
    );
    const missing = await expectDomainError(
      notifications.markRead(scenario.actors.student, UNKNOWN_ID),
      'NOTIFICATION_NOT_FOUND',
    );
    await expectDomainError(
      notifications.markRead(scenario.actors.student, 'não é um identificador'),
      'NOTIFICATION_NOT_FOUND',
    );

    expect(foreign.message).toBe(missing.message);
    expect(
      (await testApp.prisma.notification.findUniqueOrThrow({ where: { id: ofAgent.id } })).read,
    ).toBe(false);
  });

  it('marks every unread notification of the actor and leaves the others alone (AC1.5.4)', async () => {
    await createNotification(testApp.prisma, { recipientId: scenario.users.student, ticketId });
    await createNotification(testApp.prisma, { recipientId: scenario.users.student, ticketId });
    const alreadyRead = await createNotification(testApp.prisma, {
      recipientId: scenario.users.student,
      ticketId,
      read: true,
      readAt: new Date('2026-09-09T08:00:00.000Z'),
    });
    await createNotification(testApp.prisma, { recipientId: scenario.users.agent, ticketId });

    await notifications.markAllRead(scenario.actors.student);

    expect(await notifications.countUnread(scenario.actors.student)).toEqual({ count: 0 });
    expect(await notifications.countUnread(scenario.actors.agent)).toEqual({ count: 1 });
    const untouched = await testApp.prisma.notification.findUniqueOrThrow({
      where: { id: alreadyRead.id },
    });
    expect(untouched.readAt?.toISOString()).toBe('2026-09-09T08:00:00.000Z');
  });

  it('pages the list of notifications', async () => {
    for (let index = 0; index < 3; index += 1) {
      await createNotification(testApp.prisma, {
        recipientId: scenario.users.student,
        ticketId,
        createdAt: new Date(BASE_TIME.getTime() - index * 60_000),
      });
    }

    const firstPage = await notifications.list(
      scenario.actors.student,
      {},
      { page: 1, pageSize: 2 },
    );
    const secondPage = await notifications.list(
      scenario.actors.student,
      {},
      { page: 2, pageSize: 2 },
    );

    expect(firstPage).toMatchObject({ total: 3, page: 1, pageSize: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(secondPage.items).toHaveLength(1);
  });
});
