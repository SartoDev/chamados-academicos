import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { FIRST_PAGE } from '../../../src/common/pagination.js';
import { TicketsPublicService } from '../../../src/tickets/tickets-public.service.js';
import type { TicketCountGroup } from '../../../src/tickets/tickets.types.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import {
  ADMIN_AVERAGE_HANDLING_SECONDS,
  ADMIN_AVERAGE_RESOLUTION_SECONDS,
  ADMIN_COUNT_TOTAL,
  ADMIN_HANDLING_SAMPLE,
  ADMIN_RESOLUTION_SAMPLE,
  CLOSING_PERIOD_FILTER,
  createReportScenario,
  HOUR_SECONDS,
  MANAGER_AVERAGE_HANDLING_SECONDS,
  MANAGER_AVERAGE_RESOLUTION_SECONDS,
  MANAGER_COUNT_TOTAL,
  MANAGER_HANDLING_SAMPLE,
  MANAGER_RESOLUTION_SAMPLE,
  PERIOD_FILTER,
  PERIOD_FROM,
  PERIOD_TO,
  type ReportScenario,
} from './support/report-scenario.js';

const EMPTY_PERIOD = {
  openedFrom: '2027-01-01T00:00:00.000Z',
  openedTo: '2027-02-01T00:00:00.000Z',
};
const EMPTY_CLOSING_PERIOD = {
  closedFrom: '2027-01-01T00:00:00.000Z',
  closedTo: '2027-02-01T00:00:00.000Z',
};

function countOf(groups: readonly TicketCountGroup[], groupId: string): number {
  return groups.find((group) => group.groupId === groupId)?.count ?? 0;
}

function total(groups: readonly TicketCountGroup[]): number {
  return groups.reduce((sum, group) => sum + group.count, 0);
}

describe('aggregations of SVC-05 against PostgreSQL (BR3.1 to BR3.2, BR4.1 to BR4.3 of U4)', () => {
  let testApp: TestApp;
  let scenario: ReportScenario;
  let tickets: TicketsPublicService;

  beforeAll(async () => {
    testApp = await createTestApp();
    tickets = testApp.app.get(TicketsPublicService);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createReportScenario(testApp);
  });

  describe('countTickets (BR3.1, BR3.2)', () => {
    it('counts by status what the manager of the sector may see', async () => {
      const groups = await tickets.countTickets(scenario.actors.manager, PERIOD_FILTER, 'status');

      expect(countOf(groups, scenario.statuses.OPEN)).toBe(3);
      expect(countOf(groups, scenario.statuses.IN_ANALYSIS)).toBe(1);
      expect(countOf(groups, scenario.statuses.CLOSED)).toBe(4);
      // BR3.2: every visible ticket of the period falls in exactly one group.
      expect(total(groups)).toBe(MANAGER_COUNT_TOTAL);
    });

    it('omits the groups without any ticket in the period (BR3.1)', async () => {
      const groups = await tickets.countTickets(scenario.actors.manager, PERIOD_FILTER, 'status');

      expect(groups.map((group) => group.groupId)).not.toContain(
        scenario.statuses.WAITING_REQUESTER,
      );
    });

    it('counts by category, keeping the categories of other sectors out of the manager view', async () => {
      const groups = await tickets.countTickets(scenario.actors.manager, PERIOD_FILTER, 'category');

      expect(countOf(groups, scenario.categories.documentos)).toBe(MANAGER_COUNT_TOTAL);
      expect(countOf(groups, scenario.categories.boletos)).toBe(0);
    });

    it('gives the administrator every ticket of the period, the manager only the visible ones', async () => {
      const forManager = await tickets.countTickets(
        scenario.actors.manager,
        PERIOD_FILTER,
        'sector',
      );
      const forAdmin = await tickets.countTickets(scenario.actors.admin, PERIOD_FILTER, 'sector');

      expect(total(forManager)).toBe(MANAGER_COUNT_TOTAL);
      expect(total(forAdmin)).toBe(ADMIN_COUNT_TOTAL);
      expect(total(forAdmin)).toBeGreaterThan(total(forManager));
    });

    it('leaves the ticket of another sector out and keeps the one that passed through (BR1.2)', async () => {
      const forManager = await tickets.countTickets(
        scenario.actors.manager,
        PERIOD_FILTER,
        'sector',
      );

      // The ticket transferred away is still counted, under the sector where it sits today.
      expect(countOf(forManager, scenario.sectors.secretaria)).toBe(MANAGER_COUNT_TOTAL - 1);
      expect(countOf(forManager, scenario.sectors.financeiro)).toBe(1);
      // The ticket that never touched Secretaria never reaches the numbers of its manager.
      const financeOnly = await tickets.countTickets(
        scenario.actors.financeManager,
        PERIOD_FILTER,
        'sector',
      );
      expect(countOf(financeOnly, scenario.sectors.financeiro)).toBe(2);
    });

    it('cuts by the opening, including the first instant and excluding the last (BR2.1)', async () => {
      const inside = await tickets.countTickets(scenario.actors.admin, PERIOD_FILTER, 'status');
      const narrower = await tickets.countTickets(
        scenario.actors.admin,
        { openedFrom: '2026-09-01T00:00:00.001Z', openedTo: PERIOD_TO },
        'status',
      );
      const widened = await tickets.countTickets(
        scenario.actors.admin,
        { openedFrom: PERIOD_FROM, openedTo: '2026-10-01T00:00:00.001Z' },
        'status',
      );

      // Moving the start past the ticket opened exactly at it drops that ticket.
      expect(total(narrower)).toBe(total(inside) - 1);
      // Moving the end past the ticket opened exactly at it brings that ticket in.
      expect(total(widened)).toBe(total(inside) + 1);
    });

    it('answers an empty list and a zero total for a period without tickets (BR2.2)', async () => {
      const groups = await tickets.countTickets(scenario.actors.manager, EMPTY_PERIOD, 'status');

      expect(groups).toEqual([]);
      expect(total(groups)).toBe(0);
    });
  });

  describe('getDurationAverages (BR4.1 to BR4.3)', () => {
    it('averages the two durations over their own samples, for the manager', async () => {
      const averages = await tickets.getDurationAverages(
        scenario.actors.manager,
        CLOSING_PERIOD_FILTER,
      );

      expect(averages.resolutionSampleSize).toBe(MANAGER_RESOLUTION_SAMPLE);
      expect(averages.averageResolutionSeconds).toBeCloseTo(MANAGER_AVERAGE_RESOLUTION_SECONDS, 3);
      expect(averages.handlingSampleSize).toBe(MANAGER_HANDLING_SAMPLE);
      expect(averages.averageHandlingSeconds).toBeCloseTo(MANAGER_AVERAGE_HANDLING_SECONDS, 3);
    });

    it('keeps a ticket closed without an assignee in the resolution sample only (BR4.1)', async () => {
      const averages = await tickets.getDurationAverages(
        scenario.actors.manager,
        CLOSING_PERIOD_FILTER,
      );

      expect(averages.resolutionSampleSize).toBeGreaterThan(averages.handlingSampleSize);
      expect(averages.resolutionSampleSize - averages.handlingSampleSize).toBe(2);
    });

    it('takes the first assignment of the life of the ticket, not a later transfer (BR4.1)', async () => {
      const single = await tickets.getDurationAverages(scenario.actors.manager, {
        closedFrom: '2026-09-12T00:00:00.000Z',
        closedTo: '2026-09-13T00:00:00.000Z',
      });

      // Only the reopened ticket closed on 09-12: assigned one hour after it was opened, then
      // unassigned eleven hours later, which never moves the milestone.
      expect(single.handlingSampleSize).toBe(1);
      expect(single.averageHandlingSeconds).toBeCloseTo(HOUR_SECONDS, 3);
    });

    it('counts a reopened and reclosed ticket once, by its most recent closing (BR4.2)', async () => {
      const aroundFirstClosing = await tickets.getDurationAverages(scenario.actors.manager, {
        closedFrom: '2026-09-09T00:00:00.000Z',
        closedTo: '2026-09-10T00:00:00.000Z',
      });
      const aroundSecondClosing = await tickets.getDurationAverages(scenario.actors.manager, {
        closedFrom: '2026-09-12T00:00:00.000Z',
        closedTo: '2026-09-13T00:00:00.000Z',
      });

      expect(aroundFirstClosing.resolutionSampleSize).toBe(0);
      expect(aroundSecondClosing.resolutionSampleSize).toBe(1);
      expect(aroundSecondClosing.averageResolutionSeconds).toBeCloseTo(96 * HOUR_SECONDS, 3);
    });

    it('leaves a reopened ticket that is still open out of both samples (BR4.3)', async () => {
      const wholePeriod = await tickets.getDurationAverages(
        scenario.actors.admin,
        CLOSING_PERIOD_FILTER,
      );

      expect(wholePeriod.resolutionSampleSize).toBe(ADMIN_RESOLUTION_SAMPLE);
      const stillOpen = await testApp.prisma.ticket.findUniqueOrThrow({
        where: { id: scenario.tickets.reopenedStillOpen },
        select: { closedAt: true },
      });
      expect(stillOpen.closedAt).toBeNull();
    });

    it('cuts by the closing, including the first instant and excluding the last (BR4.3)', async () => {
      const wholePeriod = await tickets.getDurationAverages(
        scenario.actors.manager,
        CLOSING_PERIOD_FILTER,
      );
      const narrower = await tickets.getDurationAverages(scenario.actors.manager, {
        closedFrom: '2026-09-01T00:00:00.001Z',
        closedTo: PERIOD_TO,
      });
      const widened = await tickets.getDurationAverages(scenario.actors.manager, {
        closedFrom: PERIOD_FROM,
        closedTo: '2026-10-01T00:00:00.001Z',
      });

      expect(narrower.resolutionSampleSize).toBe(wholePeriod.resolutionSampleSize - 1);
      expect(widened.resolutionSampleSize).toBe(wholePeriod.resolutionSampleSize + 1);
    });

    it('gives the administrator a larger sample than the manager in the same period (BR1.2)', async () => {
      const forAdmin = await tickets.getDurationAverages(
        scenario.actors.admin,
        CLOSING_PERIOD_FILTER,
      );

      expect(forAdmin.resolutionSampleSize).toBe(ADMIN_RESOLUTION_SAMPLE);
      expect(forAdmin.averageResolutionSeconds).toBeCloseTo(ADMIN_AVERAGE_RESOLUTION_SECONDS, 3);
      expect(forAdmin.handlingSampleSize).toBe(ADMIN_HANDLING_SAMPLE);
      expect(forAdmin.averageHandlingSeconds).toBeCloseTo(ADMIN_AVERAGE_HANDLING_SECONDS, 3);
      expect(forAdmin.resolutionSampleSize).toBeGreaterThan(MANAGER_RESOLUTION_SAMPLE);
    });

    it('answers both averages empty and both samples zero for a period without tickets (BR2.2)', async () => {
      const averages = await tickets.getDurationAverages(
        scenario.actors.manager,
        EMPTY_CLOSING_PERIOD,
      );

      expect(averages).toEqual({
        averageHandlingSeconds: null,
        averageResolutionSeconds: null,
        resolutionSampleSize: 0,
        handlingSampleSize: 0,
      });
    });

    it('gives a student no number at all, because the visibility travels inside the query', async () => {
      const averages = await tickets.getDurationAverages(
        scenario.actors.otherStudent,
        CLOSING_PERIOD_FILTER,
      );

      expect(averages.resolutionSampleSize).toBe(0);
      expect(averages.averageResolutionSeconds).toBeNull();
    });

    it('gives a manager without a sector no number at all (BR1.3)', async () => {
      const averages = await tickets.getDurationAverages(
        { id: scenario.users.manager, role: 'MANAGER', sectorId: null },
        CLOSING_PERIOD_FILTER,
      );

      expect(averages.resolutionSampleSize).toBe(0);
      expect(averages.handlingSampleSize).toBe(0);
    });

    it('accepts the catalog filters together with the closing window', async () => {
      const filtered = await tickets.getDurationAverages(scenario.actors.admin, {
        ...CLOSING_PERIOD_FILTER,
        sectorId: scenario.sectors.financeiro,
      });

      expect(filtered.resolutionSampleSize).toBe(1);
      expect(filtered.averageResolutionSeconds).toBeCloseTo(4 * HOUR_SECONDS, 3);
    });

    it('narrows by status and by category inside the same aggregate query', async () => {
      const byStatus = await tickets.getDurationAverages(scenario.actors.admin, {
        ...CLOSING_PERIOD_FILTER,
        statusId: scenario.statuses.CLOSED,
      });
      const byCategory = await tickets.getDurationAverages(scenario.actors.admin, {
        ...CLOSING_PERIOD_FILTER,
        categoryId: scenario.categories.boletos,
      });

      // Every closed ticket of the window carries the closed status, so the filter changes nothing.
      expect(byStatus.resolutionSampleSize).toBe(ADMIN_RESOLUTION_SAMPLE);
      // Only the ticket of Financeiro belongs to that category.
      expect(byCategory.resolutionSampleSize).toBe(1);
      expect(byCategory.averageResolutionSeconds).toBeCloseTo(4 * HOUR_SECONDS, 3);
    });

    it('also narrows by the opening window, on top of the closing one', async () => {
      const narrowed = await tickets.getDurationAverages(scenario.actors.manager, {
        ...CLOSING_PERIOD_FILTER,
        openedFrom: PERIOD_FROM,
        openedTo: PERIOD_TO,
      });

      // The ticket opened before the period leaves the sample, the other three stay.
      expect(narrowed.resolutionSampleSize).toBe(MANAGER_RESOLUTION_SAMPLE - 1);
    });
  });

  describe('searchTickets (review finding R-02)', () => {
    it('brings the opening instant on every row', async () => {
      const page = await tickets.searchTickets(
        scenario.actors.manager,
        { openedFrom: PERIOD_FROM, openedTo: PERIOD_TO },
        { page: 1, pageSize: 100 },
      );

      expect(page.items).toHaveLength(MANAGER_COUNT_TOTAL);
      for (const item of page.items) {
        expect(item.openedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }
      const closed = page.items.find((item) => item.id === scenario.tickets.closedWithAssignee);
      expect(closed?.openedAt).toBe('2026-09-05T08:00:00.000Z');
    });

    it('still pages and filters as U2 defined it', async () => {
      const page = await tickets.searchTickets(
        scenario.actors.manager,
        { statusId: scenario.statuses.CLOSED, openedFrom: PERIOD_FROM, openedTo: PERIOD_TO },
        FIRST_PAGE,
      );

      expect(page.total).toBe(4);
      expect(page.items.every((item) => item.statusId === scenario.statuses.CLOSED)).toBe(true);
    });
  });
});
