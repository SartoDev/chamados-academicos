import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Actor } from '../../../src/auth/actor.js';
import { FIRST_PAGE } from '../../../src/common/pagination.js';
import { TicketActionsService } from '../../../src/tickets/ticket-actions.service.js';
import { TicketsService } from '../../../src/tickets/tickets.service.js';
import { expectDomainError } from '../../support/expect-domain-error.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import {
  ONE_HOUR_MS,
  openTicketOfStudentInSecretaria,
  ticketInAnalysisAssignedTo,
  ticketTransferredFromSecretariaToFinanceiro,
} from './support/factories.js';
import { createTicketScenario, type TicketScenario } from './support/scenario.js';

const BASE_TIME = new Date('2026-09-10T12:00:00.000Z');
const UNKNOWN_ID = '00000000-0000-4000-8000-0000000000ee';

describe('ticket listings and reading against PostgreSQL (WF2)', () => {
  let testApp: TestApp;
  let scenario: TicketScenario;
  let tickets: TicketsService;
  let actions: TicketActionsService;

  const referencesOf = async (actor: Actor, query: Parameters<TicketsService['list']>[1]) => {
    const page = await tickets.list(actor, query, { page: 1, pageSize: 50 });
    return page.items.map((item) => item.reference);
  };

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

  describe('my tickets (BR2.1, BR2.5)', () => {
    it('lists only the tickets of the requester, newest update first', async () => {
      const mine = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        updatedAt: new Date(BASE_TIME.getTime() - ONE_HOUR_MS),
      });
      const alsoMine = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        updatedAt: BASE_TIME,
      });
      await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        requesterId: scenario.users.otherStudent,
      });

      const page = await tickets.list(scenario.actors.student, { view: 'requested' }, FIRST_PAGE);

      expect(page.total).toBe(2);
      expect(page.items.map((item) => item.id)).toEqual([alsoMine.id, mine.id]);
      expect(page.items[0]).toMatchObject({
        requester: { id: scenario.users.student, name: scenario.names.student },
        category: { id: scenario.categories.documentos, name: 'Documentos' },
        sector: { id: scenario.sectors.secretaria, name: 'Secretaria' },
        status: { key: 'OPEN', label: 'Aberto' },
        priority: { label: 'Normal' },
      });
    });

    it('combines the filters and keeps the total (AC1.3.2, AC1.3.7)', async () => {
      const inSecretaria = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        categoryId: scenario.categories.boletos,
        sectorId: scenario.sectors.financeiro,
      });
      await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        statusId: scenario.statuses.CLOSED,
        closedAt: BASE_TIME,
      });

      expect(
        await referencesOf(scenario.actors.student, {
          view: 'requested',
          statusId: scenario.statuses.OPEN,
          categoryId: scenario.categories.documentos,
          sectorId: scenario.sectors.secretaria,
        }),
      ).toEqual([`#${inSecretaria.number}`]);
      const closedOnly = await tickets.list(
        scenario.actors.student,
        { view: 'requested', statusId: scenario.statuses.CLOSED },
        FIRST_PAGE,
      );
      expect(closedOnly.total).toBe(1);
    });

    it('sorts by reference, by opening and by update, in both directions (BR2.5)', async () => {
      const first = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        openedAt: new Date(BASE_TIME.getTime() - 2 * ONE_HOUR_MS),
      });
      const second = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        openedAt: new Date(BASE_TIME.getTime() - ONE_HOUR_MS),
      });

      expect(
        await referencesOf(scenario.actors.student, {
          view: 'requested',
          sort: 'reference',
          order: 'asc',
        }),
      ).toEqual([`#${first.number}`, `#${second.number}`]);
      expect(
        await referencesOf(scenario.actors.student, {
          view: 'requested',
          sort: 'openedAt',
          order: 'desc',
        }),
      ).toEqual([`#${second.number}`, `#${first.number}`]);
    });

    it('pages the result while keeping the total (AC1.3.7)', async () => {
      for (let index = 0; index < 3; index += 1) {
        await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
          openedAt: new Date(BASE_TIME.getTime() - index * ONE_HOUR_MS),
          updatedAt: new Date(BASE_TIME.getTime() - index * ONE_HOUR_MS),
        });
      }

      const firstPage = await tickets.list(
        scenario.actors.student,
        { view: 'requested' },
        { page: 1, pageSize: 2 },
      );
      const secondPage = await tickets.list(
        scenario.actors.student,
        { view: 'requested' },
        { page: 2, pageSize: 2 },
      );

      expect(firstPage).toMatchObject({ total: 3, page: 1, pageSize: 2 });
      expect(firstPage.items).toHaveLength(2);
      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.total).toBe(3);
    });
  });

  describe('sector queue (BR2.6, BR2.9)', () => {
    it('offers the four slices of the sector', async () => {
      const unassigned = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const mine = await ticketInAnalysisAssignedTo(testApp.prisma, scenario, scenario.users.agent);
      const someoneElse = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.otherAgent,
      );
      const passed = await ticketTransferredFromSecretariaToFinanceiro(testApp.prisma, scenario);

      expect(
        await referencesOf(scenario.actors.agent, { view: 'queue', queue: 'unassigned' }),
      ).toEqual([`#${unassigned.number}`]);
      expect(await referencesOf(scenario.actors.agent, { view: 'queue', queue: 'mine' })).toEqual([
        `#${mine.number}`,
      ]);
      expect(
        (await referencesOf(scenario.actors.agent, { view: 'queue', queue: 'all' })).sort(),
      ).toEqual([`#${mine.number}`, `#${someoneElse.number}`, `#${unassigned.number}`].sort());
      expect(await referencesOf(scenario.actors.agent, { view: 'queue', queue: 'passed' })).toEqual(
        [`#${passed.number}`],
      );
    });

    it('marks a ticket whose assignee became unavailable, in every slice (BR3.9, R-02)', async () => {
      await ticketInAnalysisAssignedTo(testApp.prisma, scenario, scenario.users.agent);
      await testApp.prisma.user.update({
        where: { id: scenario.users.agent },
        data: { active: false },
      });

      const all = await tickets.list(
        scenario.actors.manager,
        { view: 'queue', queue: 'all' },
        FIRST_PAGE,
      );
      const unassignedSlice = await tickets.list(
        scenario.actors.manager,
        { view: 'queue', queue: 'unassigned' },
        FIRST_PAGE,
      );

      expect(all.items[0]).toMatchObject({
        assignee: { id: scenario.users.agent, name: scenario.names.agent },
        assigneeUnavailable: true,
      });
      // The slice of unassigned tickets keeps following the assignee column (BR2.6).
      expect(unassignedSlice.total).toBe(0);
    });

    it('keeps each listing for its roles and refuses the queue without a sector (AC2.1.4)', async () => {
      const agentWithoutSector: Actor = { id: scenario.users.agent, role: 'AGENT', sectorId: null };

      await expectDomainError(
        tickets.list(scenario.actors.student, { view: 'queue' }, FIRST_PAGE),
        'FORBIDDEN',
      );
      await expectDomainError(
        tickets.list(scenario.actors.agent, { view: 'requested' }, FIRST_PAGE),
        'FORBIDDEN',
      );
      await expectDomainError(
        tickets.list(scenario.actors.manager, { view: 'all' }, FIRST_PAGE),
        'FORBIDDEN',
      );
      await expectDomainError(
        tickets.list(scenario.actors.admin, { view: 'queue' }, FIRST_PAGE),
        'FORBIDDEN',
      );
      // Unreachable through HTTP, where U1 requires a sector for AGENT and MANAGER (BR3.3).
      await expectDomainError(
        tickets.list(agentWithoutSector, { view: 'queue' }, FIRST_PAGE),
        'TICKET_QUEUE_NO_SECTOR',
      );
    });

    it('shows every ticket to the administrator, in read-only (BR2.3)', async () => {
      const secretaria = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      const financeiro = await openTicketOfStudentInSecretaria(testApp.prisma, scenario, {
        requesterId: scenario.users.professor,
        categoryId: scenario.categories.boletos,
        sectorId: scenario.sectors.financeiro,
      });

      const page = await tickets.list(scenario.actors.admin, { view: 'all' }, FIRST_PAGE);

      expect(page.items.map((item) => item.id).sort()).toEqual(
        [secretaria.id, financeiro.id].sort(),
      );
      await expectDomainError(actions.assume(scenario.actors.admin, secretaria.id), 'FORBIDDEN');
      await expectDomainError(actions.close(scenario.actors.admin, secretaria.id), 'FORBIDDEN');
    });
  });

  describe('reading one ticket (BR2.4, BR2.7, BR2.8)', () => {
    it('answers identically for a ticket of somebody else and for one that does not exist', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      const foreign = await expectDomainError(
        tickets.getDetail(scenario.actors.otherStudent, ticket.id),
        'TICKET_NOT_FOUND',
      );
      const missing = await expectDomainError(
        tickets.getDetail(scenario.actors.otherStudent, UNKNOWN_ID),
        'TICKET_NOT_FOUND',
      );

      expect({ code: foreign.code, message: foreign.message, details: foreign.details }).toEqual({
        code: missing.code,
        message: missing.message,
        details: missing.details,
      });
    });

    it('keeps the history and the passages behind the same visibility', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      await expectDomainError(
        tickets.listHistory(scenario.actors.otherStudent, ticket.id, FIRST_PAGE),
        'TICKET_NOT_FOUND',
      );
      await expectDomainError(
        tickets.listPassages(scenario.actors.otherStudent, ticket.id, FIRST_PAGE),
        'TICKET_NOT_FOUND',
      );
      expect(
        (await tickets.listHistory(scenario.actors.student, ticket.id, FIRST_PAGE)).total,
      ).toBe(0);
    });

    it('reads the history in order, with resolved names and the transfer justification', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      await actions.assume(scenario.actors.agent, ticket.id);
      testApp.clock.set(new Date(BASE_TIME.getTime() + ONE_HOUR_MS));
      await actions.transfer(scenario.actors.agent, ticket.id, {
        targetSectorId: scenario.sectors.financeiro,
        justification: 'Assunto do Financeiro.',
      });

      const history = await tickets.listHistory(scenario.actors.student, ticket.id, FIRST_PAGE);

      expect(history.items).toMatchObject([
        {
          field: 'STATUS',
          previousValue: 'Aberto',
          newValue: 'Em análise',
          author: { name: scenario.names.agent },
          justification: null,
        },
        { field: 'ASSIGNEE', previousValue: null, newValue: scenario.names.agent },
        { field: 'STATUS', previousValue: 'Em análise', newValue: 'Aberto' },
        { field: 'ASSIGNEE', previousValue: scenario.names.agent, newValue: null },
        {
          field: 'SECTOR',
          previousValue: 'Secretaria',
          newValue: 'Financeiro',
          justification: 'Assunto do Financeiro.',
        },
      ]);
    });

    it('lists the sectors the ticket passed through with entry, exit and author (AC2.4.7)', async () => {
      const ticket = await ticketTransferredFromSecretariaToFinanceiro(testApp.prisma, scenario);

      const passages = await tickets.listPassages(scenario.actors.student, ticket.id, FIRST_PAGE);

      expect(passages.items).toMatchObject([
        {
          sector: { id: scenario.sectors.secretaria, name: 'Secretaria' },
          transferredBy: { id: scenario.users.agent, name: scenario.names.agent },
        },
        {
          sector: { id: scenario.sectors.financeiro, name: 'Financeiro' },
          leftAt: null,
          justification: null,
          transferredBy: null,
        },
      ]);
      expect(passages.items[0]?.leftAt).not.toBeNull();
    });

    it('keeps showing deactivated catalog items and users (AC4.1.5, AC4.2.4, BR5.3)', async () => {
      const ticket = await ticketInAnalysisAssignedTo(
        testApp.prisma,
        scenario,
        scenario.users.agent,
      );
      await testApp.prisma.category.update({
        where: { id: scenario.categories.documentos },
        data: { active: false },
      });
      await testApp.prisma.user.update({
        where: { id: scenario.users.student },
        data: { active: false },
      });

      const detail = await tickets.getDetail(scenario.actors.agent, ticket.id);

      expect(detail).toMatchObject({
        category: { name: 'Documentos' },
        requester: { name: scenario.names.student },
        assignee: { name: scenario.names.agent },
      });
    });
  });

  describe('who may receive an assignment (BR8.5)', () => {
    it('lists the active agents and managers of the sector, in name order', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);
      await testApp.prisma.user.update({
        where: { id: scenario.users.otherAgent },
        data: { active: false },
      });

      const assignable = await tickets.listAssignableUsers(scenario.actors.manager, ticket.id);

      expect(assignable.items).toEqual([
        { id: scenario.users.agent, name: scenario.names.agent },
        { id: scenario.users.manager, name: scenario.names.manager },
      ]);
    });

    it('refuses the agent, the manager of another sector and an invisible ticket', async () => {
      const ticket = await openTicketOfStudentInSecretaria(testApp.prisma, scenario);

      await expectDomainError(
        tickets.listAssignableUsers(scenario.actors.agent, ticket.id),
        'FORBIDDEN',
      );
      await expectDomainError(
        tickets.listAssignableUsers(scenario.actors.student, ticket.id),
        'FORBIDDEN',
      );
      await expectDomainError(
        tickets.listAssignableUsers(scenario.actors.financeManager, ticket.id),
        'TICKET_NOT_FOUND',
      );
    });
  });
});
