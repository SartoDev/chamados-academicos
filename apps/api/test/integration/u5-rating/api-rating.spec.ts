import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Role } from '../../../src/common/roles.js';
import type { RatingSummaryView } from '../../../src/reporting/reporting.types.js';
import type { RatingView } from '../../../src/tickets/rating.types.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { API, expectErrorEnvelope, http } from '../u1-foundation/support/http.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';
import type { ScenarioUser } from '../u2-tickets/support/scenario.js';
import { ratingCommentOfLength } from './support/factories.js';
import {
  ADMIN_RATING_COUNT,
  createRatingScenario,
  EMPTY_PERIOD_FROM,
  EMPTY_PERIOD_TO,
  MANAGER_AVERAGE_SCORE,
  MANAGER_RATING_COUNT,
  PERIOD_FROM,
  PERIOD_TO,
  type RatingScenario,
} from './support/rating-scenario.js';

const PERIOD = { from: PERIOD_FROM, to: PERIOD_TO };
const UNKNOWN_TICKET_ID = '00000000-0000-4000-8000-000000000000';

const USER_BY_ROLE: Record<Role, ScenarioUser> = {
  STUDENT: 'student',
  PROFESSOR: 'professor',
  AGENT: 'agent',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

const ALL_ROLES: Role[] = ['STUDENT', 'PROFESSOR', 'AGENT', 'MANAGER', 'ADMIN'];

describe('API-U5 against a real application (BR1.1 to BR3.3)', () => {
  let testApp: TestApp;
  let scenario: RatingScenario;

  const ratingPath = (ticketId: string) => `${API}/tickets/${ticketId}/rating`;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    scenario = await createRatingScenario(testApp);
  });

  describe('happy path of the three operations', () => {
    it('stores the rating of the requester and answers it (WF1)', async () => {
      const response = await http(testApp)
        .put(ratingPath(scenario.tickets.closedUnrated))
        .set('Cookie', scenario.cookies.student)
        .send({ score: 5, comment: 'Atendimento excelente.' });

      expect(response.status).toBe(200);
      expect(response.body as RatingView).toMatchObject({
        ticketId: scenario.tickets.closedUnrated,
        score: 5,
        comment: 'Atendimento excelente.',
      });
      expect(Object.keys(response.body as object).sort()).toEqual([
        'comment',
        'ratedAt',
        'score',
        'ticketId',
      ]);
    });

    it('answers the stored rating to whoever may see the ticket (WF2)', async () => {
      const byRequester = await http(testApp)
        .get(ratingPath(scenario.tickets.ratedInPeriod))
        .set('Cookie', scenario.cookies.student);
      const byAgent = await http(testApp)
        .get(ratingPath(scenario.tickets.ratedInPeriod))
        .set('Cookie', scenario.cookies.agent);
      const byAdmin = await http(testApp)
        .get(ratingPath(scenario.tickets.ratedInPeriod))
        .set('Cookie', scenario.cookies.admin);

      expect(byRequester.status).toBe(200);
      expect(byAgent.status).toBe(200);
      expect(byAdmin.status).toBe(200);
      expect((byAgent.body as RatingView).score).toBe(4);
      expect(byAdmin.body).toEqual(byRequester.body);
    });

    it('answers the rating summary of the period to the manager (WF3)', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/ratings`)
        .set('Cookie', scenario.cookies.manager)
        .query(PERIOD);

      expect(response.status).toBe(200);
      const body = response.body as RatingSummaryView;
      expect(body.count).toBe(MANAGER_RATING_COUNT);
      expect(body.averageScore).toBeCloseTo(MANAGER_AVERAGE_SCORE, 6);
      expect(body).toMatchObject({ from: PERIOD_FROM, to: PERIOD_TO });
    });

    it('widens the summary for the administrator, without any comment in it (BR3.3)', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/ratings`)
        .set('Cookie', scenario.cookies.admin)
        .query(PERIOD);

      expect(response.status).toBe(200);
      expect((response.body as RatingSummaryView).count).toBe(ADMIN_RATING_COUNT);
      expect(Object.keys(response.body as object).sort()).toEqual([
        'averageScore',
        'count',
        'from',
        'to',
      ]);
      expect(JSON.stringify(response.body)).not.toContain('Atendimento');
    });

    it('answers an empty average and a zero count for a period without ratings (BR3.2)', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/ratings`)
        .set('Cookie', scenario.cookies.manager)
        .query({ from: EMPTY_PERIOD_FROM, to: EMPTY_PERIOD_TO });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        averageScore: null,
        count: 0,
        from: EMPTY_PERIOD_FROM,
        to: EMPTY_PERIOD_TO,
      });
    });
  });

  describe('without a session (CT6)', () => {
    it('answers 401 on the three operations', async () => {
      const read = await http(testApp).get(ratingPath(scenario.tickets.ratedInPeriod));
      const write = await http(testApp)
        .put(ratingPath(scenario.tickets.closedUnrated))
        .send({ score: 4 });
      const summary = await http(testApp).get(`${API}/reports/ratings`).query(PERIOD);

      expectErrorEnvelope(read, 401, 'UNAUTHENTICATED');
      expectErrorEnvelope(write, 401, 'UNAUTHENTICATED');
      expectErrorEnvelope(summary, 401, 'UNAUTHENTICATED');
    });
  });

  describe('roles that may not call the operation (AC5.1.1, CT6)', () => {
    it.each(['AGENT', 'MANAGER', 'ADMIN'] as Role[])(
      'answers 403 to %s on the rating of a ticket',
      async (role) => {
        const response = await http(testApp)
          .put(ratingPath(scenario.tickets.closedUnrated))
          .set('Cookie', scenario.cookies[USER_BY_ROLE[role]])
          .send({ score: 4 });

        expectErrorEnvelope(response, 403, 'FORBIDDEN');
        expect(
          await testApp.prisma.rating.count({
            where: { ticketId: scenario.tickets.closedUnrated },
          }),
        ).toBe(0);
      },
    );

    it.each(['STUDENT', 'PROFESSOR', 'AGENT'] as Role[])(
      'answers 403 to %s on the rating summary',
      async (role) => {
        const response = await http(testApp)
          .get(`${API}/reports/ratings`)
          .set('Cookie', scenario.cookies[USER_BY_ROLE[role]])
          .query(PERIOD);

        expectErrorEnvelope(response, 403, 'FORBIDDEN');
      },
    );

    it('opens the reading of a rating to every authenticated role that sees the ticket', async () => {
      const statuses = await Promise.all(
        ALL_ROLES.map(async (role) => {
          const response = await http(testApp)
            .get(ratingPath(scenario.tickets.ratedInPeriod))
            .set('Cookie', scenario.cookies[USER_BY_ROLE[role]]);
          return [role, response.status] as const;
        }),
      );

      // The professor is not the requester and works in no sector, so the ticket is invisible
      // to them and the answer is the 404 of BR1.3, never a 403.
      expect(Object.fromEntries(statuses)).toEqual({
        STUDENT: 200,
        PROFESSOR: 404,
        AGENT: 200,
        MANAGER: 200,
        ADMIN: 200,
      });
    });
  });

  describe('the identical 404 (AC5.2.1, AC5.2.2, BR1.3)', () => {
    it('answers a ticket of somebody else exactly as a ticket that does not exist', async () => {
      const foreign = await http(testApp)
        .get(ratingPath(scenario.tickets.closedOfOtherStudent))
        .set('Cookie', scenario.cookies.student);
      const unknown = await http(testApp)
        .get(ratingPath(UNKNOWN_TICKET_ID))
        .set('Cookie', scenario.cookies.student);

      expectErrorEnvelope(foreign, 404, 'TICKET_NOT_FOUND');
      expectErrorEnvelope(unknown, 404, 'TICKET_NOT_FOUND');
      const foreignError = (foreign.body as { error: Record<string, unknown> }).error;
      const unknownError = (unknown.body as { error: Record<string, unknown> }).error;
      expect({ ...foreignError, traceId: '' }).toEqual({ ...unknownError, traceId: '' });
    });

    it('answers the same on the write path, without storing anything', async () => {
      const foreign = await http(testApp)
        .put(ratingPath(scenario.tickets.closedOfOtherStudent))
        .set('Cookie', scenario.cookies.student)
        .send({ score: 4 });
      const unknown = await http(testApp)
        .put(ratingPath(UNKNOWN_TICKET_ID))
        .set('Cookie', scenario.cookies.student)
        .send({ score: 4 });

      expectErrorEnvelope(foreign, 404, 'TICKET_NOT_FOUND');
      expectErrorEnvelope(unknown, 404, 'TICKET_NOT_FOUND');
      expect(await testApp.prisma.rating.count()).toBe(8);
    });

    it('answers RATING_NOT_FOUND on a visible ticket that was never rated', async () => {
      const response = await http(testApp)
        .get(ratingPath(scenario.tickets.closedUnrated))
        .set('Cookie', scenario.cookies.student);

      expectErrorEnvelope(response, 404, 'RATING_NOT_FOUND');
    });
  });

  describe('the two conflicts (BR1.2, BR2.3)', () => {
    it('answers 409 RATING_TICKET_NOT_CLOSED on a ticket that is not closed', async () => {
      const response = await http(testApp)
        .put(ratingPath(scenario.tickets.openUnrated))
        .set('Cookie', scenario.cookies.student)
        .send({ score: 4 });

      expectErrorEnvelope(response, 409, 'RATING_TICKET_NOT_CLOSED');
    });

    it('answers 409 RATING_ALREADY_EXISTS on the second rating, keeping the first', async () => {
      const first = await http(testApp)
        .put(ratingPath(scenario.tickets.closedUnrated))
        .set('Cookie', scenario.cookies.student)
        .send({ score: 5, comment: 'Primeira e única.' });
      const second = await http(testApp)
        .put(ratingPath(scenario.tickets.closedUnrated))
        .set('Cookie', scenario.cookies.student)
        .send({ score: 1 });

      expect(first.status).toBe(200);
      expectErrorEnvelope(second, 409, 'RATING_ALREADY_EXISTS');
      const stored = await http(testApp)
        .get(ratingPath(scenario.tickets.closedUnrated))
        .set('Cookie', scenario.cookies.student);
      expect(stored.body as RatingView).toMatchObject({
        score: 5,
        comment: 'Primeira e única.',
      });
    });

    it('still refuses a second rating after the ticket was reopened and closed again (BR2.4)', async () => {
      await testApp.prisma.ticket.update({
        where: { id: scenario.tickets.ratedAndReopened },
        data: {
          statusId: scenario.statuses.CLOSED,
          closedAt: new Date('2026-09-20T08:00:00.000Z'),
        },
      });

      const response = await http(testApp)
        .put(ratingPath(scenario.tickets.ratedAndReopened))
        .set('Cookie', scenario.cookies.student)
        .send({ score: 1 });

      expectErrorEnvelope(response, 409, 'RATING_ALREADY_EXISTS');
    });
  });

  describe('validation of the body (BR2.1, BR2.2, CT8)', () => {
    it.each([0, 6, 3.5])('answers 400 naming the score for %s', async (score) => {
      const response = await http(testApp)
        .put(ratingPath(scenario.tickets.closedUnrated))
        .set('Cookie', scenario.cookies.student)
        .send({ score });

      const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
      expect(error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'score' })]),
      );
    });

    it('answers 400 naming the score when it is missing or is not a number', async () => {
      const missing = await http(testApp)
        .put(ratingPath(scenario.tickets.closedUnrated))
        .set('Cookie', scenario.cookies.student)
        .send({ comment: 'Sem nota.' });
      const text = await http(testApp)
        .put(ratingPath(scenario.tickets.closedUnrated))
        .set('Cookie', scenario.cookies.student)
        .send({ score: 'cinco' });

      expectErrorEnvelope(missing, 400, 'VALIDATION_FAILED');
      expectErrorEnvelope(text, 400, 'VALIDATION_FAILED');
    });

    it('answers 400 naming the comment past five hundred characters', async () => {
      const response = await http(testApp)
        .put(ratingPath(scenario.tickets.closedUnrated))
        .set('Cookie', scenario.cookies.student)
        .send({ score: 4, comment: ratingCommentOfLength(501) });

      const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
      expect(error.details).toEqual([{ field: 'comment', code: 'TOO_LONG' }]);
    });

    it('accepts exactly five hundred characters and keeps the line breaks', async () => {
      const comment = `${ratingCommentOfLength(400)}\n${ratingCommentOfLength(99)}`;

      const response = await http(testApp)
        .put(ratingPath(scenario.tickets.closedUnrated))
        .set('Cookie', scenario.cookies.student)
        .send({ score: 4, comment });

      expect(response.status).toBe(200);
      expect((response.body as RatingView).comment).toBe(comment);
    });

    it('answers 400 naming the identifier when the ticket is not a UUID', async () => {
      const response = await http(testApp)
        .get(`${API}/tickets/not-a-uuid/rating`)
        .set('Cookie', scenario.cookies.student);

      const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
      expect(error.details).toEqual([{ field: 'ticketId', code: 'INVALID_UUID' }]);
    });

    it('discards an unknown field instead of refusing the request (X-01)', async () => {
      const response = await http(testApp)
        .put(ratingPath(scenario.tickets.closedUnrated))
        .set('Cookie', scenario.cookies.student)
        .send({ score: 3, ratedAt: '1999-01-01T00:00:00.000Z', ticketId: UNKNOWN_TICKET_ID });

      expect(response.status).toBe(200);
      expect(response.body as RatingView).toMatchObject({
        ticketId: scenario.tickets.closedUnrated,
        ratedAt: PERIOD_TO,
      });
    });

    it('answers 400 naming the period bound when it is malformed (BR2.1 of U4)', async () => {
      const response = await http(testApp)
        .get(`${API}/reports/ratings`)
        .set('Cookie', scenario.cookies.manager)
        .query({ from: 'ontem', to: PERIOD_TO });

      const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
      expect(error.details).toEqual([{ field: 'from', code: 'INVALID_DATE' }]);
    });
  });

  describe('there is no way to change or remove a rating (BR2.3)', () => {
    it.each(['patch', 'delete', 'post'] as const)(
      'answers 404 to %s on the rating path',
      async (method) => {
        const agent = http(testApp);
        const response = await agent[method](ratingPath(scenario.tickets.ratedInPeriod))
          .set('Cookie', scenario.cookies.student)
          .send({ score: 1 });

        expect(response.status).toBe(404);
        expect((response.body as { error?: unknown }).error).toBeDefined();
      },
    );
  });
});
