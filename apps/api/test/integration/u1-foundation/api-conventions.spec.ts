import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { UsersPublicService } from '../../../src/users/users-public.service.js';
import { resetToInitialLoad } from './support/database.js';
import { API, expectErrorEnvelope, http, sessionCookie } from './support/http.js';
import { snapshotU1Data } from './support/role-fixtures.js';
import { createTestApp, TEST_INITIAL_ADMIN_EMAIL, type TestApp } from './support/test-app.js';

describe('X-01 conventions on API-U1 (BR6.1 to BR6.3, CT2)', () => {
  let testApp: TestApp;
  let adminCookie: string;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    const admin = await testApp.prisma.user.findUniqueOrThrow({
      where: { email: TEST_INITIAL_ADMIN_EMAIL },
    });
    adminCookie = sessionCookie(testApp, admin.id);
  });

  it('answers every error with the single envelope and a trace id echoed in X-Trace-Id', async () => {
    const response = await http(testApp).get(`${API}/users`);

    const error = expectErrorEnvelope(response, 401, 'UNAUTHENTICATED');
    expect(error).not.toHaveProperty('details');
    expect(error.traceId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('answers an unknown route with NOT_FOUND in the envelope', async () => {
    expectErrorEnvelope(
      await http(testApp).get(`${API}/nao-existe`).set('Cookie', adminCookie),
      404,
      'NOT_FOUND',
    );
  });

  it('turns a malformed or oversized JSON body into VALIDATION_FAILED', async () => {
    const malformed = await http(testApp)
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send('{"email": "ana@example.test",');
    const oversized = await http(testApp)
      .post(`${API}/sectors`)
      .set('Cookie', adminCookie)
      .send({ name: 'x'.repeat(200_000) });

    expectErrorEnvelope(malformed, 400, 'VALIDATION_FAILED');
    expectErrorEnvelope(oversized, 400, 'VALIDATION_FAILED');
  });

  it('lists each invalid field with a specific code (BR6.3)', async () => {
    const response = await http(testApp)
      .post(`${API}/users`)
      .set('Cookie', adminCookie)
      .send({ name: '  ', email: 'sem-arroba', role: 'ADMIN', password: 'Abc1' });

    const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
    expect(error.details).toEqual(
      expect.arrayContaining([
        { field: 'name', code: 'REQUIRED' },
        { field: 'email', code: 'INVALID_EMAIL' },
        { field: 'password', code: 'PASSWORD_TOO_SHORT' },
      ]),
    );
  });

  it('validates list parameters', async () => {
    const response = await http(testApp)
      .get(`${API}/sectors`)
      .query({ page: 0, pageSize: 500, active: 'talvez' })
      .set('Cookie', adminCookie);

    const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
    expect(error.details).toEqual(
      expect.arrayContaining([
        { field: 'page', code: 'OUT_OF_RANGE' },
        { field: 'pageSize', code: 'OUT_OF_RANGE' },
        { field: 'active', code: 'INVALID_BOOLEAN' },
      ]),
    );
  });

  it('discards unknown fields instead of rejecting or storing them (BR6.2)', async () => {
    const sector = await http(testApp)
      .post(`${API}/sectors`)
      .set('Cookie', adminCookie)
      .send({
        name: 'Ouvidoria',
        active: false,
        id: '00000000-0000-4000-8000-000000000001',
        extra: 1,
      })
      .expect(201);
    const user = await http(testApp)
      .post(`${API}/users`)
      .set('Cookie', adminCookie)
      .send({
        name: 'Igor',
        email: 'igor@example.test',
        role: 'STUDENT',
        password: 'Senha12345',
        active: false,
        passwordHash: 'plain-text-attempt',
      })
      .expect(201);

    expect(sector.body).toMatchObject({ name: 'Ouvidoria', active: true });
    expect(sector.body.id).not.toBe('00000000-0000-4000-8000-000000000001');
    expect(sector.body).not.toHaveProperty('extra');
    const stored = await testApp.prisma.user.findUniqueOrThrow({ where: { id: user.body.id } });
    expect(stored.active).toBe(true);
    expect(stored.passwordHash).not.toBe('plain-text-attempt');
  });

  describe('when the actor cannot be resolved', () => {
    let failingApp: TestApp;

    beforeAll(async () => {
      failingApp = await createTestApp({
        customize: (builder) =>
          builder.overrideProvider(UsersPublicService).useValue({
            findSummariesByIds: () => Promise.reject(new Error('database unavailable')),
            isAssignableInSector: () => Promise.resolve(false),
          }),
      });
    });

    afterAll(async () => {
      await failingApp.close();
    });

    it('denies with 500 INTERNAL_ERROR, no detail and no side effect (BR2.3)', async () => {
      const admin = await failingApp.prisma.user.findUniqueOrThrow({
        where: { email: TEST_INITIAL_ADMIN_EMAIL },
      });
      const before = await snapshotU1Data(failingApp);

      const response = await http(failingApp)
        .post(`${API}/sectors`)
        .set('Cookie', sessionCookie(failingApp, admin.id))
        .send({ name: 'Não deve existir' });

      const error = expectErrorEnvelope(response, 500, 'INTERNAL_ERROR');
      expect(error).not.toHaveProperty('details');
      expect(JSON.stringify(response.body)).not.toContain('database unavailable');
      expect(await snapshotU1Data(failingApp)).toBe(before);
    });
  });
});
