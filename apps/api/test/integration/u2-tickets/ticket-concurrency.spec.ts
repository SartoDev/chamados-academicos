import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { DomainError } from '../../../src/common/errors/domain-error.js';
import { NotificationsPublicService } from '../../../src/notifications/notifications-public.service.js';
import { TicketActionsService } from '../../../src/tickets/ticket-actions.service.js';
import { TicketsService } from '../../../src/tickets/tickets.service.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import {
  openTicketOfStudentInSecretaria,
  ticketInAnalysisAssignedTo,
} from './support/factories.js';
import { createTicketScenario, type TicketScenario } from './support/scenario.js';

const BASE_TIME = new Date('2026-09-10T12:00:00.000Z');

function rejectionCodes(results: PromiseSettledResult<unknown>[]): string[] {
  return results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result) =>
      result.reason instanceof DomainError ? result.reason.code : String(result.reason),
    );
}

describe('concurrency and atomicity of ticket actions (BR6.3, BR7.2 to BR7.4)', () => {
  let testApp: TestApp;
  let scenario: TicketScenario;
  let tickets: TicketsService;
  let actions: TicketActionsService;

  beforeAll(async () => {
    testApp = await createTestApp();
    tickets = testApp.app.get(TicketsService);
    actions = testApp.app.get(TicketActionsService);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    testApp.clock.set(BASE_TIME);
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createTicketScenario(testApp);
  });

  it('gives a ticket to exactly one of two agents assuming it at the same time (BR7.2)', async () => {
    const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

    const results = await Promise.allSettled([
      actions.assume(scenario.actors.agent, ticket.id),
      actions.assume(scenario.actors.otherAgent, ticket.id),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(rejectionCodes(results)).toEqual(['TICKET_ALREADY_ASSIGNED']);
    const stored = await testApp.prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
    expect([scenario.users.agent, scenario.users.otherAgent]).toContain(stored.assigneeId);
    expect(stored.statusId).toBe(scenario.statuses.IN_ANALYSIS);
    expect(
      await testApp.prisma.ticketHistoryEntry.count({
        where: { ticketId: ticket.id, field: 'ASSIGNEE' },
      }),
    ).toBe(1);
    expect(await testApp.prisma.notification.count({ where: { ticketId: ticket.id } })).toBe(1);
  });

  it('closes a ticket once when two people close it at the same time (BR7.3)', async () => {
    const ticket = await ticketInAnalysisAssignedTo(testApp.prisma, scenario, scenario.users.agent);

    const results = await Promise.allSettled([
      actions.close(scenario.actors.agent, ticket.id),
      actions.close(scenario.actors.manager, ticket.id),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(rejectionCodes(results)).toEqual(['TICKET_INVALID_TRANSITION']);
    const stored = await testApp.prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
    expect(stored.statusId).toBe(scenario.statuses.CLOSED);
    expect(stored.closedAt).not.toBeNull();
    expect(
      await testApp.prisma.ticketHistoryEntry.count({
        where: { ticketId: ticket.id, field: 'STATUS' },
      }),
    ).toBe(1);
  });

  it('does not let two simultaneous transitions overlap on the same ticket (BR7.3)', async () => {
    const ticket = await ticketInAnalysisAssignedTo(testApp.prisma, scenario, scenario.users.agent);

    const results = await Promise.allSettled([
      actions.waitForRequester(scenario.actors.agent, ticket.id),
      actions.close(scenario.actors.manager, ticket.id),
    ]);

    const succeeded = results.filter((result) => result.status === 'fulfilled').length;
    const stored = await testApp.prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
    const statusEntries = await testApp.prisma.ticketHistoryEntry.count({
      where: { ticketId: ticket.id, field: 'STATUS' },
    });
    // Whatever the order, the final status is one the transitions allow and the history has one
    // entry per operation that actually ran.
    expect([scenario.statuses.CLOSED, scenario.statuses.WAITING_REQUESTER]).toContain(
      stored.statusId,
    );
    expect(statusEntries).toBe(succeeded);
    expect(rejectionCodes(results).every((code) => code === 'TICKET_INVALID_TRANSITION')).toBe(
      true,
    );
  });

  it('gives distinct references to tickets opened at the same time (BR1.6, BR7.4)', async () => {
    const openings = Array.from({ length: 4 }, (_, index) =>
      tickets.open(scenario.actors.student, {
        categoryId: scenario.categories.documentos,
        title: `Chamado simultâneo ${index + 1}`,
        description: 'Descrição suficientemente longa para o limite mínimo.',
      }),
    );

    const opened = await Promise.all(openings);

    const references = opened.map((detail) => detail.reference);
    expect(new Set(references).size).toBe(references.length);
    expect(await testApp.prisma.ticket.count()).toBe(4);
  });

  it('undoes the whole action when recording the notification fails (BR6.3)', async () => {
    const failingApp = await createTestApp({
      customize: (builder) =>
        builder.overrideProvider(NotificationsPublicService).useValue({
          record: () => Promise.reject(new Error('forced failure while recording the notice')),
        }),
    });
    try {
      failingApp.clock.set(BASE_TIME);
      await resetToInitialLoad(failingApp.prisma, failingApp.seed);
      const failingScenario = await createTicketScenario(failingApp);
      const ticket = await openTicketOfStudentInSecretaria(failingApp.prisma, failingScenario);
      const failingActions = failingApp.app.get(TicketActionsService);

      await expect(failingActions.assume(failingScenario.actors.agent, ticket.id)).rejects.toThrow(
        'forced failure while recording the notice',
      );

      const stored = await failingApp.prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      expect(stored.assigneeId).toBeNull();
      expect(stored.statusId).toBe(failingScenario.statuses.OPEN);
      expect(
        await failingApp.prisma.ticketHistoryEntry.count({ where: { ticketId: ticket.id } }),
      ).toBe(0);
      expect(await failingApp.prisma.notification.count({ where: { ticketId: ticket.id } })).toBe(
        0,
      );
    } finally {
      await failingApp.close();
    }
  });
});
