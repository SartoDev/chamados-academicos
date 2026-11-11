import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Role } from '../../../src/common/roles.js';
import type {
  DurationAveragesView,
  ReportTicketRowView,
  TicketCountsView,
} from '../../../src/reporting/reporting.types.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { API, expectErrorEnvelope, http } from '../u1-foundation/support/http.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import type { ScenarioUser } from '../u2-tickets/support/scenario.js';
import {
  ADMIN_COUNT_TOTAL,
  ADMIN_RESOLUTION_SAMPLE,
  createReportScenario,
  HOUR_SECONDS,
  MANAGER_AVERAGE_HANDLING_SECONDS,
  MANAGER_AVERAGE_RESOLUTION_SECONDS,
  MANAGER_COUNT_TOTAL,
  MANAGER_HANDLING_SAMPLE,
  MANAGER_RESOLUTION_SAMPLE,
  PERIOD_FROM,
  PERIOD_TO,
  type ReportScenario,
} from './support/report-scenario.js';

const PERIOD = { from: PERIOD_FROM, to: PERIOD_TO };

const COOKIE_BY_ROLE: Record<Role, ScenarioUser> = {
  STUDENT: 'student',
  PROFESSOR: 'professor',
  AGENT: 'agent',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

interface ReportOperation {
  id: string;
  path: string;
  query: Record<string, string>;
  /** Roles the route accepts; every other role must be refused with 403 (BR1.1, NFR2). */
  allowed: Role[];
}

const OPERATIONS: ReportOperation[] = [
  {
    id: 'getTicketCounts',
    path: '/reports/ticket-counts',
    query: { groupBy: 'status', ...PERIOD },
    allowed: ['MANAGER', 'ADMIN'],
  },
  {
    id: 'getAverageDurations',
    path: '/reports/durations',
    query: { ...PERIOD },
    allowed: ['MANAGER', 'ADMIN'],
  },
  {
    id: 'searchTicketsForReport',
    path: '/reports/tickets',
    query: { ...PERIOD },
    allowed: ['MANAGER'],
  },
];

describe('API-U4 against a real application (BR1.1 to BR5.2)', () => {
  let testApp: TestApp;
  let scenario: ReportScenario;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createReportScenario(testApp);
  });

  describe('happy path', () => {
    it('answers the counts of the manager grouped by status', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/ticket-counts`)
        .set('Cookie', scenario.cookies.manager)
        .query({ groupBy: 'status', ...PERIOD });

      expect(response.status).toBe(200);
      const body = response.body as TicketCountsView;
      expect(body.total).toBe(MANAGER_COUNT_TOTAL);
      expect(body).toMatchObject({ from: PERIOD_FROM, to: PERIOD_TO });
      expect(body.groups.every((group) => group.label.length > 0)).toBe(true);
    });

    it('answers the counts by category and by sector for the administrator', async () => {
      const byCategory = await http(testApp)
        .get(`${API}/reports/ticket-counts`)
        .set('Cookie', scenario.cookies.admin)
        .query({ groupBy: 'category', ...PERIOD });
      const bySector = await http(testApp)
        .get(`${API}/reports/ticket-counts`)
        .set('Cookie', scenario.cookies.admin)
        .query({ groupBy: 'sector', ...PERIOD });

      expect(byCategory.status).toBe(200);
      expect(bySector.status).toBe(200);
      expect((byCategory.body as TicketCountsView).total).toBe(ADMIN_COUNT_TOTAL);
      expect((bySector.body as TicketCountsView).groups).toHaveLength(2);
    });

    it('answers the two averages with the two samples (BR4.3)', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/durations`)
        .set('Cookie', scenario.cookies.manager)
        .query(PERIOD);

      expect(response.status).toBe(200);
      const body = response.body as DurationAveragesView;
      expect(body.resolutionSampleSize).toBe(MANAGER_RESOLUTION_SAMPLE);
      expect(body.handlingSampleSize).toBe(MANAGER_HANDLING_SAMPLE);
      expect(body.averageResolutionSeconds).toBeCloseTo(MANAGER_AVERAGE_RESOLUTION_SECONDS, 3);
      expect(body.averageHandlingSeconds).toBeCloseTo(MANAGER_AVERAGE_HANDLING_SECONDS, 3);
      // The contract field `sampleSize` was replaced by the two above; it never travels.
      expect(body).not.toHaveProperty('sampleSize');
    });

    it('answers the filtered listing of the manager, paginated (BR5.1)', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/tickets`)
        .set('Cookie', scenario.cookies.manager)
        .query({ ...PERIOD, statusId: scenario.statuses.CLOSED, pageSize: '2' });

      expect(response.status).toBe(200);
      const body = response.body as { items: ReportTicketRowView[]; total: number };
      expect(body.total).toBe(4);
      expect(body.items).toHaveLength(2);
      expect(body.items[0]).toMatchObject({
        status: { id: scenario.statuses.CLOSED, name: 'Encerrado' },
      });
      expect(typeof body.items[0]?.openedAt).toBe('string');
    });

    it('answers an empty result for a period without tickets, never an error (BR2.2)', async () => {
      const counts = await http(testApp)
        .get(`${API}/reports/ticket-counts`)
        .set('Cookie', scenario.cookies.manager)
        .query({
          groupBy: 'status',
          from: '2027-01-01T00:00:00.000Z',
          to: '2027-02-01T00:00:00.000Z',
        });
      const durations = await http(testApp)
        .get(`${API}/reports/durations`)
        .set('Cookie', scenario.cookies.manager)
        .query({ from: '2027-01-01T00:00:00.000Z', to: '2027-02-01T00:00:00.000Z' });

      expect(counts.status).toBe(200);
      expect(counts.body).toMatchObject({ groups: [], total: 0 });
      expect(durations.status).toBe(200);
      expect(durations.body).toMatchObject({
        averageHandlingSeconds: null,
        averageResolutionSeconds: null,
        resolutionSampleSize: 0,
        handlingSampleSize: 0,
      });
    });
  });

  describe('access (BR1.1)', () => {
    it.each(OPERATIONS)('refuses $id without a session, with 401', async (operation) => {
      const response = await http(testApp).get(`${API}${operation.path}`).query(operation.query);

      expectErrorEnvelope(response, 401, 'UNAUTHENTICATED');
    });

    it.each(OPERATIONS)('accepts only the declared roles on $id', async (operation) => {
      for (const [role, user] of Object.entries(COOKIE_BY_ROLE) as [Role, ScenarioUser][]) {
        const response = await http(testApp)
          .get(`${API}${operation.path}`)
          .set('Cookie', scenario.cookies[user])
          .query(operation.query);

        if (operation.allowed.includes(role)) {
          expect(response.status).toBe(200);
        } else {
          expectErrorEnvelope(response, 403, 'FORBIDDEN');
        }
      }
    });

    it('refuses the report listing to the administrator, who uses the general listing (Q5)', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/tickets`)
        .set('Cookie', scenario.cookies.admin)
        .query(PERIOD);

      expectErrorEnvelope(response, 403, 'FORBIDDEN');
    });

    it('never lets the numbers of the manager reach beyond what she sees (BR1.2)', async () => {
      const forManager = await http(testApp)
        .get(`${API}/reports/ticket-counts`)
        .set('Cookie', scenario.cookies.manager)
        .query({ groupBy: 'status', ...PERIOD });
      const forAdmin = await http(testApp)
        .get(`${API}/reports/ticket-counts`)
        .set('Cookie', scenario.cookies.admin)
        .query({ groupBy: 'status', ...PERIOD });

      expect((forManager.body as TicketCountsView).total).toBe(MANAGER_COUNT_TOTAL);
      expect((forAdmin.body as TicketCountsView).total).toBe(ADMIN_COUNT_TOTAL);
      expect((forManager.body as TicketCountsView).total).toBeLessThan(
        (forAdmin.body as TicketCountsView).total,
      );
    });

    it('gives the administrator a larger duration sample than the manager, same period', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/durations`)
        .set('Cookie', scenario.cookies.admin)
        .query(PERIOD);

      expect((response.body as DurationAveragesView).resolutionSampleSize).toBe(
        ADMIN_RESOLUTION_SAMPLE,
      );
      expect(ADMIN_RESOLUTION_SAMPLE).toBeGreaterThan(MANAGER_RESOLUTION_SAMPLE);
    });

    it('answers no ticket of another sector to the manager of Financeiro', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/tickets`)
        .set('Cookie', scenario.cookies.financeManager)
        .query({ ...PERIOD, pageSize: '100' });

      const ids = (response.body as { items: ReportTicketRowView[] }).items.map((item) => item.id);
      expect(ids).toContain(scenario.tickets.financeClosed);
      expect(ids).not.toContain(scenario.tickets.closedWithAssignee);
    });
  });

  describe('validation (BR2.1, BR3.1)', () => {
    it('refuses a malformed period naming the field, with 400', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/durations`)
        .set('Cookie', scenario.cookies.manager)
        .query({ from: 'ontem', to: PERIOD_TO });

      const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
      expect(error.details).toEqual([{ field: 'from', code: 'INVALID_DATE' }]);
    });

    it('refuses an inverted period naming the field, with 400', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/ticket-counts`)
        .set('Cookie', scenario.cookies.manager)
        .query({ groupBy: 'status', from: PERIOD_TO, to: PERIOD_FROM });

      const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
      expect(error.details).toEqual([{ field: 'from', code: 'INVALID_RANGE' }]);
    });

    it('refuses a count without a grouping, with 400', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/ticket-counts`)
        .set('Cookie', scenario.cookies.manager)
        .query(PERIOD);

      const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
      expect(error.details).toEqual([{ field: 'groupBy', code: 'INVALID_VALUE' }]);
    });

    it('refuses an unknown grouping, with 400', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/ticket-counts`)
        .set('Cookie', scenario.cookies.manager)
        .query({ groupBy: 'priority', ...PERIOD });

      expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
    });

    it('refuses a filter that is not an identifier, with 400', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/tickets`)
        .set('Cookie', scenario.cookies.manager)
        .query({ ...PERIOD, statusId: 'encerrado' });

      const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
      expect(error.details).toEqual([{ field: 'statusId', code: 'INVALID_UUID' }]);
    });

    it('refuses a page size beyond the limit of X-01, with 400', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/tickets`)
        .set('Cookie', scenario.cookies.manager)
        .query({ ...PERIOD, pageSize: '500' });

      expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
    });

    it('applies the last thirty days when no bound is sent (BR7.2)', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/durations`)
        .set('Cookie', scenario.cookies.manager);

      expect(response.status).toBe(200);
      const body = response.body as DurationAveragesView;
      expect(body).toMatchObject({ from: PERIOD_FROM, to: PERIOD_TO });
      expect(body.averageHandlingSeconds).toBeCloseTo(HOUR_SECONDS, 3);
    });
  });

  describe('no export anywhere (BR5.2)', () => {
    it('offers no download route under reports', async () => {
      for (const path of ['/reports/export', '/reports/tickets/export', '/reports/tickets.csv']) {
        const response = await http(testApp)
          .get(`${API}${path}`)
          .set('Cookie', scenario.cookies.manager);

        expect(response.status).toBe(404);
      }
    });

    it('never answers a listing with a file content type', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/tickets`)
        .set('Cookie', scenario.cookies.manager)
        .query(PERIOD);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toBeUndefined();
    });
  });
});
