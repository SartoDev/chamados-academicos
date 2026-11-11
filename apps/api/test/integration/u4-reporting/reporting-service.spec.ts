import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { FIRST_PAGE } from '../../../src/common/pagination.js';
import { ReportingService } from '../../../src/reporting/reporting.service.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import { controlledTicket } from './support/factories.js';
import {
  createReportScenario,
  MANAGER_AVERAGE_RESOLUTION_SECONDS,
  MANAGER_COUNT_TOTAL,
  MANAGER_RESOLUTION_SAMPLE,
  PERIOD_FROM,
  PERIOD_TO,
  type ReportScenario,
} from './support/report-scenario.js';

const PERIOD = { from: PERIOD_FROM, to: PERIOD_TO };

describe('ReportingService against PostgreSQL (BR3.3, BR5.1, review finding R-02)', () => {
  let testApp: TestApp;
  let scenario: ReportScenario;
  let reporting: ReportingService;

  beforeAll(async () => {
    testApp = await createTestApp();
    reporting = testApp.app.get(ReportingService);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createReportScenario(testApp);
  });

  describe('getTicketCounts', () => {
    it('resolves the label of every group from the catalog of U1 (BR3.3)', async () => {
      const counts = await reporting.getTicketCounts(scenario.actors.manager, 'status', PERIOD);

      const labels = Object.fromEntries(counts.groups.map((group) => [group.id, group.label]));
      expect(labels[scenario.statuses.OPEN]).toBe('Aberto');
      expect(labels[scenario.statuses.IN_ANALYSIS]).toBe('Em análise');
      expect(labels[scenario.statuses.CLOSED]).toBe('Encerrado');
      expect(counts.groups.every((group) => group.label.length > 0)).toBe(true);
    });

    it('resolves the label of a deactivated catalog item too (BR3.3)', async () => {
      await controlledTicket(testApp.prisma, scenario, {
        title: 'Chamado de categoria aposentada',
        categoryId: scenario.categories.retired,
        openedAt: new Date('2026-09-14T08:00:00.000Z'),
      });

      const counts = await reporting.getTicketCounts(scenario.actors.manager, 'category', PERIOD);

      const retired = counts.groups.find((group) => group.id === scenario.categories.retired);
      expect(retired).toEqual({
        id: scenario.categories.retired,
        label: 'Categoria aposentada',
        count: 1,
      });
    });

    it('answers the total as the sum of the groups and echoes the period (BR3.2)', async () => {
      const counts = await reporting.getTicketCounts(scenario.actors.manager, 'status', PERIOD);

      expect(counts.total).toBe(MANAGER_COUNT_TOTAL);
      expect(counts.total).toBe(counts.groups.reduce((sum, group) => sum + group.count, 0));
      expect(counts).toMatchObject({ from: PERIOD_FROM, to: PERIOD_TO });
    });

    it('orders the groups by size, so the bar chart is stable between two reads', async () => {
      const counts = await reporting.getTicketCounts(scenario.actors.admin, 'sector', PERIOD);

      const sizes = counts.groups.map((group) => group.count);
      expect(sizes).toEqual([...sizes].sort((left, right) => right - left));
    });

    it('falls back to the last thirty days of the clock when no bound is sent (BR7.2)', async () => {
      const byDefault = await reporting.getTicketCounts(scenario.actors.manager, 'status', {});

      // The controlled clock stands at the end of the period, so the default window is it.
      expect(byDefault).toMatchObject({ from: PERIOD_FROM, to: PERIOD_TO });
      expect(byDefault.total).toBe(MANAGER_COUNT_TOTAL);
    });

    it('answers an empty list for a period without tickets, never an error (BR2.2)', async () => {
      const counts = await reporting.getTicketCounts(scenario.actors.manager, 'category', {
        from: '2027-01-01T00:00:00.000Z',
        to: '2027-02-01T00:00:00.000Z',
      });

      expect(counts.groups).toEqual([]);
      expect(counts.total).toBe(0);
    });
  });

  describe('getAverageDurations', () => {
    it('echoes the period next to the two averages and the two samples (BR4.3)', async () => {
      const averages = await reporting.getDurationAverages(scenario.actors.manager, PERIOD);

      expect(averages.from).toBe(PERIOD_FROM);
      expect(averages.to).toBe(PERIOD_TO);
      expect(averages.resolutionSampleSize).toBe(MANAGER_RESOLUTION_SAMPLE);
      expect(averages.averageResolutionSeconds).toBeCloseTo(MANAGER_AVERAGE_RESOLUTION_SECONDS, 3);
      // BR4.4: nothing else travels with the numbers — no goal, no threshold.
      expect(Object.keys(averages).sort()).toEqual([
        'averageHandlingSeconds',
        'averageResolutionSeconds',
        'from',
        'handlingSampleSize',
        'resolutionSampleSize',
        'to',
      ]);
    });
  });

  describe('searchTickets', () => {
    it('builds the complete row from the identifiers U2 answers (review finding R-02)', async () => {
      const page = await reporting.searchTickets(scenario.actors.manager, {}, PERIOD, {
        page: 1,
        pageSize: 100,
      });

      const row = page.items.find((item) => item.id === scenario.tickets.closedWithAssignee);
      expect(row).toEqual({
        id: scenario.tickets.closedWithAssignee,
        reference: expect.stringMatching(/^#\d+$/),
        title: 'Encerrado com responsável',
        category: { id: scenario.categories.documentos, name: 'Documentos' },
        sector: { id: scenario.sectors.secretaria, name: 'Secretaria' },
        status: { id: scenario.statuses.CLOSED, name: 'Encerrado' },
        priority: { id: scenario.priorities.normal, name: 'Normal' },
        assignee: { id: scenario.users.agent, name: scenario.names.agent },
        openedAt: '2026-09-05T08:00:00.000Z',
        updatedAt: '2026-09-06T08:00:00.000Z',
      });
    });

    it('leaves the assignee empty on a ticket that never had one', async () => {
      const page = await reporting.searchTickets(scenario.actors.manager, {}, PERIOD, {
        page: 1,
        pageSize: 100,
      });

      const row = page.items.find((item) => item.id === scenario.tickets.closedWithoutAssignee);
      expect(row?.assignee).toBeNull();
    });

    it('keeps the name of an assignee who was deactivated (BR3.3)', async () => {
      await testApp.prisma.user.update({
        where: { id: scenario.users.agent },
        data: { active: false },
      });

      const page = await reporting.searchTickets(scenario.actors.manager, {}, PERIOD, FIRST_PAGE);

      const row = page.items.find((item) => item.id === scenario.tickets.inAnalysis);
      expect(row?.assignee).toEqual({ id: scenario.users.agent, name: scenario.names.agent });
    });

    it('combines the filters with the period and pages the answer (BR5.1)', async () => {
      const page = await reporting.searchTickets(
        scenario.actors.manager,
        { statusId: scenario.statuses.CLOSED, categoryId: scenario.categories.documentos },
        PERIOD,
        { page: 1, pageSize: 2 },
      );

      expect(page.total).toBe(4);
      expect(page.items).toHaveLength(2);
      expect(page.page).toBe(1);
      expect(page.pageSize).toBe(2);
      expect(page.items.every((item) => item.status.id === scenario.statuses.CLOSED)).toBe(true);
    });

    it('never lists a ticket the manager cannot see (BR1.2)', async () => {
      const page = await reporting.searchTickets(scenario.actors.manager, {}, PERIOD, {
        page: 1,
        pageSize: 100,
      });

      expect(page.items.map((item) => item.id)).not.toContain(scenario.tickets.financeClosed);
      expect(page.items.map((item) => item.id)).toContain(scenario.tickets.transferredToFinanceiro);
    });
  });
});
