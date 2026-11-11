import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { TicketActionsService } from '../../../src/tickets/ticket-actions.service.js';
import { TicketsService } from '../../../src/tickets/tickets.service.js';
import { expectDomainError } from '../../support/expect-domain-error.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
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

describe('ticket lifecycle against PostgreSQL (WF1, WF3 to WF9)', () => {
  let testApp: TestApp;
  let scenario: TicketScenario;
  let tickets: TicketsService;
  let actions: TicketActionsService;

  const historyOf = (ticketId: string) =>
    testApp.prisma.ticketHistoryEntry.findMany({
      where: { ticketId },
      orderBy: [{ occurredAt: 'asc' }, { field: 'asc' }],
    });
  const notificationsOf = (ticketId: string) =>
    testApp.prisma.notification.findMany({
      where: { ticketId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  const passagesOf = (ticketId: string) =>
    testApp.prisma.ticketSectorPassage.findMany({
      where: { ticketId },
      orderBy: [{ enteredAt: 'asc' }, { id: 'asc' }],
    });

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

  describe('WF1 — opening a ticket', () => {
    it('opens it in the sector of the category, open, without assignee and with the first passage', async () => {
      const detail = await tickets.open(scenario.actors.student, {
        categoryId: scenario.categories.documentos,
        title: '  Revisão de nota  ',
        description: '  Gostaria de solicitar a revisão da nota da P2.  ',
      });

      expect(detail).toMatchObject({
        reference: '#1',
        title: 'Revisão de nota',
        description: 'Gostaria de solicitar a revisão da nota da P2.',
        sector: { id: scenario.sectors.secretaria },
        status: { key: 'OPEN' },
        priority: { label: 'Normal' },
        requester: { id: scenario.users.student, name: scenario.names.student },
        assignee: null,
        assigneeUnavailable: false,
        closedAt: null,
      });
      expect(detail.openedAt).toBe(BASE_TIME.toISOString());
      const passages = await passagesOf(detail.id);
      expect(passages).toHaveLength(1);
      expect(passages[0]).toMatchObject({
        sectorId: scenario.sectors.secretaria,
        leftAt: null,
        justification: null,
      });
      // BR1.5: the opening itself is not a change, so it records no history.
      expect(await historyOf(detail.id)).toEqual([]);
      expect(await notificationsOf(detail.id)).toEqual([]);
    });

    it('accepts a chosen active priority and refuses an inactive or unknown one (BR1.4)', async () => {
      const withHighPriority = await tickets.open(scenario.actors.professor, {
        categoryId: scenario.categories.documentos,
        title: 'Declaração de vínculo',
        description: 'Preciso de uma declaração de vínculo para estágio.',
        priorityId: scenario.priorities.alta,
      });
      expect(withHighPriority.priority).toEqual({ id: scenario.priorities.alta, label: 'Alta' });

      await testApp.prisma.priority.update({
        where: { id: scenario.priorities.alta },
        data: { active: false },
      });
      await expectDomainError(
        tickets.open(scenario.actors.student, {
          categoryId: scenario.categories.documentos,
          title: 'Outro pedido',
          description: 'Descrição suficientemente longa.',
          priorityId: scenario.priorities.alta,
        }),
        'CATALOG_ITEM_INACTIVE',
      );
      await expectDomainError(
        tickets.open(scenario.actors.student, {
          categoryId: scenario.categories.documentos,
          title: 'Outro pedido',
          description: 'Descrição suficientemente longa.',
          priorityId: '00000000-0000-4000-8000-0000000000aa',
        }),
        'CATALOG_ITEM_NOT_FOUND',
      );
    });

    it('refuses an unavailable category and anyone who is not a requester (BR1.1, BR1.3)', async () => {
      await expectDomainError(
        tickets.open(scenario.actors.student, {
          categoryId: scenario.categories.retired,
          title: 'Categoria aposentada',
          description: 'Descrição suficientemente longa.',
        }),
        'CATALOG_ITEM_INACTIVE',
      );
      await expectDomainError(
        tickets.open(scenario.actors.agent, {
          categoryId: scenario.categories.documentos,
          title: 'Chamado do atendente',
          description: 'Descrição suficientemente longa.',
        }),
        'FORBIDDEN',
      );
      expect(await testApp.prisma.ticket.count()).toBe(0);
    });
  });

  describe('WF3 — assuming a ticket', () => {
    it('makes the actor the assignee, moves the ticket to analysis and tells the requester', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const detail = await actions.assume(scenario.actors.agent, ticket.id);

      expect(detail).toMatchObject({
        status: { key: 'IN_ANALYSIS' },
        assignee: { id: scenario.users.agent, name: scenario.names.agent },
        assigneeUnavailable: false,
      });
      expect(detail.updatedAt).toBe(BASE_TIME.toISOString());
      expect(await historyOf(ticket.id)).toMatchObject([
        {
          field: 'STATUS',
          previousValue: scenario.statuses.OPEN,
          newValue: scenario.statuses.IN_ANALYSIS,
          authorId: scenario.users.agent,
        },
        { field: 'ASSIGNEE', previousValue: null, newValue: scenario.users.agent },
      ]);
      expect(await notificationsOf(ticket.id)).toMatchObject([
        { recipientId: scenario.users.student, kind: 'ASSIGNEE_CHANGED', read: false },
      ]);
    });

    it('refuses to take a ticket from an available assignee and names them (BR3.1, AC2.2.2)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const error = await expectDomainError(
        actions.assume(scenario.actors.otherAgent, ticket.id),
        'TICKET_ALREADY_ASSIGNED',
      );

      expect(error.details).toEqual({
        assignee: { id: scenario.users.agent, name: scenario.names.agent },
      });
      const unchanged = await testApp.prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
      expect(unchanged.assigneeId).toBe(scenario.users.agent);
      expect(await notificationsOf(ticket.id)).toEqual([]);
    });

    it('lets any agent of the sector take a ticket whose assignee became unavailable (BR3.9, Q6)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      // The assignee is moved to another sector by the administration (BR3.10 of U1).
      await testApp.prisma.user.update({
        where: { id: scenario.users.agent },
        data: { sectorId: scenario.sectors.financeiro },
      });

      const detail = await actions.assume(scenario.actors.otherAgent, ticket.id);

      expect(detail.assignee).toEqual({
        id: scenario.users.otherAgent,
        name: scenario.names.otherAgent,
      });
      expect(detail.assigneeUnavailable).toBe(false);
      expect(detail.status.key).toBe('IN_ANALYSIS');
    });

    it('refuses a closed ticket, an invisible one and the sector that only reads it', async () => {
      const closed = await closedTicketHoursAgo(testApp.prisma, scenario, 1, BASE_TIME);
      const transferred = await ticketTransferredFromSecretariaToFinanceiro(
        testApp.prisma,
        scenario,
      );
      const otherSector = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        categoryId: scenario.categories.boletos,
        sectorId: scenario.sectors.financeiro,
      });

      await expectDomainError(actions.assume(scenario.actors.agent, closed.id), 'TICKET_CLOSED');
      // Visible only through the passage of the sector: read-only (BR3.8).
      await expectDomainError(actions.assume(scenario.actors.agent, transferred.id), 'FORBIDDEN');
      // Never passed through Secretaria: identical to a ticket that does not exist (BR2.4).
      await expectDomainError(
        actions.assume(scenario.actors.agent, otherSector.id),
        'TICKET_NOT_FOUND',
      );
      await expectDomainError(
        actions.assume(scenario.actors.agent, '00000000-0000-4000-8000-0000000000ff'),
        'TICKET_NOT_FOUND',
      );
    });
  });

  describe('WF4 — assigning a ticket', () => {
    it('lets the manager choose the assignee and moves an open ticket to analysis', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const detail = await actions.assign(scenario.actors.manager, ticket.id, scenario.users.agent);

      expect(detail).toMatchObject({
        status: { key: 'IN_ANALYSIS' },
        assignee: { id: scenario.users.agent },
      });
      expect(await historyOf(ticket.id)).toHaveLength(2);
      expect(await notificationsOf(ticket.id)).toMatchObject([
        { recipientId: scenario.users.student, kind: 'ASSIGNEE_CHANGED' },
      ]);
    });

    it('reassigns without touching the status and refuses somebody from another sector', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const detail = await actions.assign(
        scenario.actors.manager,
        ticket.id,
        scenario.users.otherAgent,
      );

      expect(detail).toMatchObject({
        status: { key: 'IN_ANALYSIS' },
        assignee: { id: scenario.users.otherAgent },
      });
      expect(await historyOf(ticket.id)).toMatchObject([
        {
          field: 'ASSIGNEE',
          previousValue: scenario.users.agent,
          newValue: scenario.users.otherAgent,
        },
      ]);
      await expectDomainError(
        actions.assign(scenario.actors.manager, ticket.id, scenario.users.financeAgent),
        'TICKET_ASSIGNEE_NOT_IN_SECTOR',
      );
      await expectDomainError(
        actions.assign(scenario.actors.manager, ticket.id, scenario.users.student),
        'TICKET_ASSIGNEE_NOT_IN_SECTOR',
      );
    });

    it('changes nothing when the chosen person is already the assignee (WF4)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const detail = await actions.assign(scenario.actors.manager, ticket.id, scenario.users.agent);

      expect(detail.assignee).toMatchObject({ id: scenario.users.agent });
      expect(await historyOf(ticket.id)).toEqual([]);
      expect(await notificationsOf(ticket.id)).toEqual([]);
    });

    it('refuses an agent who is not the manager of the sector (AC3.1.4)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      await expectDomainError(
        actions.assign(scenario.actors.agent, ticket.id, scenario.users.otherAgent),
        'FORBIDDEN',
      );
    });
  });

  describe('WF5 — waiting for the requester', () => {
    it('moves a ticket in analysis to waiting and tells the requester', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const detail = await actions.waitForRequester(scenario.actors.agent, ticket.id);

      expect(detail.status.key).toBe('WAITING_REQUESTER');
      expect(await notificationsOf(ticket.id)).toMatchObject([
        { recipientId: scenario.users.student, kind: 'STATUS_CHANGED' },
      ]);
    });

    it('refuses from any other status and from anyone who is not the assignee or the manager', async () => {
      const open = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        assigneeId: scenario.users.agent,
      });
      const inAnalysis = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      await expectDomainError(
        actions.waitForRequester(scenario.actors.agent, open.id),
        'TICKET_INVALID_TRANSITION',
      );
      await expectDomainError(
        actions.waitForRequester(scenario.actors.otherAgent, inAnalysis.id),
        'FORBIDDEN',
      );
      // The manager of the sector may do it even without being the assignee (Q7).
      expect(
        (await actions.waitForRequester(scenario.actors.manager, inAnalysis.id)).status.key,
      ).toBe('WAITING_REQUESTER');
    });
  });

  describe('WF6 — closing a ticket', () => {
    it('lets the requester close their own ticket and tells the assignee (AC1.6.7)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      const detail = await actions.close(scenario.actors.student, ticket.id);

      expect(detail.status.key).toBe('CLOSED');
      expect(detail.closedAt).toBe(BASE_TIME.toISOString());
      expect(await notificationsOf(ticket.id)).toMatchObject([
        { recipientId: scenario.users.agent, kind: 'STATUS_CHANGED' },
      ]);
    });

    it('lets the attendance close it, tells the requester, and refuses to close it twice', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );

      await actions.close(scenario.actors.manager, ticket.id);

      expect(await notificationsOf(ticket.id)).toMatchObject([
        { recipientId: scenario.users.student, kind: 'STATUS_CHANGED' },
      ]);
      await expectDomainError(
        actions.close(scenario.actors.agent, ticket.id),
        'TICKET_INVALID_TRANSITION',
      );
      await expectDomainError(
        actions.close(scenario.actors.otherStudent, ticket.id),
        'TICKET_NOT_FOUND',
      );
    });
  });

  describe('WF7 — reopening a ticket', () => {
    it('brings it back to open inside the window, keeps the assignee and tells them', async () => {
      const ticket = await closedTicketHoursAgo(testApp.prisma, scenario, 71.5, BASE_TIME, {
        assigneeId: scenario.users.agent,
      });

      const detail = await actions.reopen(scenario.actors.student, ticket.id);

      expect(detail).toMatchObject({
        status: { key: 'OPEN' },
        closedAt: null,
        assignee: { id: scenario.users.agent },
      });
      expect(await historyOf(ticket.id)).toMatchObject([
        {
          field: 'STATUS',
          previousValue: scenario.statuses.CLOSED,
          newValue: scenario.statuses.OPEN,
          authorId: scenario.users.student,
        },
      ]);
      expect(await notificationsOf(ticket.id)).toMatchObject([
        { recipientId: scenario.users.agent, kind: 'TICKET_REOPENED' },
      ]);
    });

    it('refuses exactly at 72 hours and accepts at 71h59 (AC1.6.2)', async () => {
      const justInside = await closedTicketHoursAgo(
        testApp.prisma,
        scenario,
        71 + 59 / 60,
        BASE_TIME,
      );
      const justOutside = await closedTicketHoursAgo(testApp.prisma, scenario, 72, BASE_TIME);

      expect((await actions.reopen(scenario.actors.student, justInside.id)).status.key).toBe(
        'OPEN',
      );
      await expectDomainError(
        actions.reopen(scenario.actors.student, justOutside.id),
        'TICKET_REOPEN_WINDOW_EXPIRED',
      );
    });

    it('refuses the attendance, a ticket that is not closed and somebody else ticket', async () => {
      const closed = await closedTicketHoursAgo(testApp.prisma, scenario, 1, BASE_TIME);
      const open = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      await expectDomainError(actions.reopen(scenario.actors.agent, closed.id), 'FORBIDDEN');
      await expectDomainError(actions.reopen(scenario.actors.manager, closed.id), 'FORBIDDEN');
      await expectDomainError(
        actions.reopen(scenario.actors.student, open.id),
        'TICKET_INVALID_TRANSITION',
      );
      await expectDomainError(
        actions.reopen(scenario.actors.otherStudent, closed.id),
        'TICKET_NOT_FOUND',
      );
    });
  });

  describe('WF8 — transferring a ticket', () => {
    it('closes the passage, opens the next one, frees the ticket and tells the requester', async () => {
      const ticket = await ticketWaitingRequester(testApp.prisma, scenario, scenario.users.agent);
      testApp.clock.set(new Date(BASE_TIME.getTime() + ONE_HOUR_MS));

      const detail = await actions.transfer(scenario.actors.agent, ticket.id, {
        targetSectorId: scenario.sectors.financeiro,
        justification: JUSTIFICATION,
      });

      expect(detail).toMatchObject({
        sector: { id: scenario.sectors.financeiro },
        status: { key: 'OPEN' },
        assignee: null,
      });
      const passages = await passagesOf(ticket.id);
      expect(passages).toMatchObject([
        {
          sectorId: scenario.sectors.secretaria,
          justification: JUSTIFICATION,
          transferredById: scenario.users.agent,
        },
        { sectorId: scenario.sectors.financeiro, leftAt: null, justification: null },
      ]);
      expect(passages[0]?.leftAt).not.toBeNull();
      expect(await historyOf(ticket.id)).toMatchObject([
        { field: 'STATUS', newValue: scenario.statuses.OPEN },
        { field: 'ASSIGNEE', previousValue: scenario.users.agent, newValue: null },
        {
          field: 'SECTOR',
          previousValue: scenario.sectors.secretaria,
          newValue: scenario.sectors.financeiro,
          justification: JUSTIFICATION,
        },
      ]);
      expect(await notificationsOf(ticket.id)).toMatchObject([
        { recipientId: scenario.users.student, kind: 'SECTOR_CHANGED' },
      ]);
    });

    it('keeps an open ticket open and leaves the origin sector in read-only (AC2.1.3)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const detail = await actions.transfer(scenario.actors.manager, ticket.id, {
        targetSectorId: scenario.sectors.financeiro,
        justification: JUSTIFICATION,
      });

      expect(detail.status.key).toBe('OPEN');
      expect(await historyOf(ticket.id)).toMatchObject([{ field: 'SECTOR' }]);
      // Secretaria still reads it, and no longer acts on it (BR3.8).
      expect((await tickets.getDetail(scenario.actors.agent, ticket.id)).id).toBe(ticket.id);
      await expectDomainError(actions.assume(scenario.actors.agent, ticket.id), 'FORBIDDEN');
      // Financeiro now works on it.
      expect(
        (await actions.assume(scenario.actors.financeAgent, ticket.id)).assignee,
      ).toMatchObject({ id: scenario.users.financeAgent });
    });

    it('refuses the same sector, an inactive destination and a closed ticket', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const closed = await closedTicketHoursAgo(testApp.prisma, scenario, 1, BASE_TIME);
      await testApp.prisma.sector.update({
        where: { id: scenario.sectors.financeiro },
        data: { active: false },
      });

      await expectDomainError(
        actions.transfer(scenario.actors.agent, ticket.id, {
          targetSectorId: scenario.sectors.secretaria,
          justification: JUSTIFICATION,
        }),
        'TICKET_TRANSFER_SAME_SECTOR',
      );
      await expectDomainError(
        actions.transfer(scenario.actors.agent, ticket.id, {
          targetSectorId: scenario.sectors.financeiro,
          justification: JUSTIFICATION,
        }),
        'CATALOG_ITEM_INACTIVE',
      );
      await expectDomainError(
        actions.transfer(scenario.actors.agent, closed.id, {
          targetSectorId: scenario.sectors.financeiro,
          justification: JUSTIFICATION,
        }),
        'TICKET_CLOSED',
      );
      expect(await passagesOf(ticket.id)).toHaveLength(1);
    });
  });

  describe('WF9 — changing the priority', () => {
    it('records the change in the history and notifies nobody', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const detail = await actions.changePriority(
        scenario.actors.agent,
        ticket.id,
        scenario.priorities.alta,
      );

      expect(detail.priority).toEqual({ id: scenario.priorities.alta, label: 'Alta' });
      expect(await historyOf(ticket.id)).toMatchObject([
        {
          field: 'PRIORITY',
          previousValue: scenario.priorities.normal,
          newValue: scenario.priorities.alta,
          authorId: scenario.users.agent,
        },
      ]);
      expect(await notificationsOf(ticket.id)).toEqual([]);
    });

    it('changes nothing when it is already the priority, and refuses an inactive one', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      await testApp.prisma.priority.update({
        where: { id: scenario.priorities.baixa },
        data: { active: false },
      });

      const unchanged = await actions.changePriority(
        scenario.actors.agent,
        ticket.id,
        scenario.priorities.normal,
      );

      expect(unchanged.priority.id).toBe(scenario.priorities.normal);
      expect(await historyOf(ticket.id)).toEqual([]);
      await expectDomainError(
        actions.changePriority(scenario.actors.agent, ticket.id, scenario.priorities.baixa),
        'CATALOG_ITEM_INACTIVE',
      );
    });

    it('refuses the requester and a closed ticket (AC2.3.4)', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const closed = await closedTicketHoursAgo(testApp.prisma, scenario, 1, BASE_TIME);

      await expectDomainError(
        actions.changePriority(scenario.actors.student, ticket.id, scenario.priorities.alta),
        'FORBIDDEN',
      );
      await expectDomainError(
        actions.changePriority(scenario.actors.agent, closed.id, scenario.priorities.alta),
        'TICKET_CLOSED',
      );
    });
  });
});
