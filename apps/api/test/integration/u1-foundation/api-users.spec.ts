import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { resetToInitialLoad } from './support/database.js';
import { activeAgentOf, createSector, createUser } from './support/factories.js';
import { API, expectErrorEnvelope, http, sessionCookie } from './support/http.js';
import { createTestApp, TEST_INITIAL_ADMIN_EMAIL, type TestApp } from './support/test-app.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-0000000000aa';

describe('API-U1 users (US4.1)', () => {
  let testApp: TestApp;
  let admin: { id: string; cookie: string };
  let secretariaId: string;

  const validUser = (overrides: Record<string, unknown> = {}) => ({
    name: 'Nova Pessoa',
    email: 'nova.pessoa@example.test',
    role: 'STUDENT',
    password: 'Senha12345',
    ...overrides,
  });

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    const initial = await testApp.prisma.user.findUniqueOrThrow({
      where: { email: TEST_INITIAL_ADMIN_EMAIL },
    });
    admin = { id: initial.id, cookie: sessionCookie(testApp, initial.id) };
    secretariaId = (await createSector(testApp.prisma, { name: 'Secretaria' })).id;
  });

  it('lists users with pagination and filters, never exposing passwords', async () => {
    await activeAgentOf(testApp.prisma, secretariaId, { name: 'Bia' });
    await activeAgentOf(testApp.prisma, secretariaId, { name: 'Caio' });

    const response = await http(testApp)
      .get(`${API}/users`)
      .query({ role: 'AGENT', active: 'true', sectorId: secretariaId, page: 2, pageSize: 1 })
      .set('Cookie', admin.cookie)
      .expect(200);

    expect(response.body).toMatchObject({ total: 2, page: 2, pageSize: 1 });
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      name: 'Caio',
      role: 'AGENT',
      sector: { id: secretariaId, name: 'Secretaria' },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/password/i);
  });

  it('creates a user who can then sign in with the initial password (AC4.1.1)', async () => {
    const created = await http(testApp)
      .post(`${API}/users`)
      .set('Cookie', admin.cookie)
      .send(validUser({ email: ' Nova.Pessoa@Example.test ' }))
      .expect(201);

    expect(created.body).toMatchObject({
      name: 'Nova Pessoa',
      email: 'nova.pessoa@example.test',
      role: 'STUDENT',
      sector: null,
      active: true,
    });
    expect(created.body).not.toHaveProperty('password');
    expect(created.body).not.toHaveProperty('passwordHash');
    await http(testApp)
      .post(`${API}/auth/login`)
      .send({ email: 'nova.pessoa@example.test', password: 'Senha12345' })
      .expect(200);
  });

  it('refuses an e-mail already registered, ignoring case (AC4.1.2)', async () => {
    await createUser(testApp.prisma, { email: 'repetido@example.test' });

    const response = await http(testApp)
      .post(`${API}/users`)
      .set('Cookie', admin.cookie)
      .send(validUser({ email: 'REPETIDO@example.test' }));

    expectErrorEnvelope(response, 409, 'USER_EMAIL_TAKEN');
  });

  it('refuses agents and managers without an active sector (AC4.1.6)', async () => {
    const closed = await createSector(testApp.prisma, { name: 'Fechado', active: false });

    expectErrorEnvelope(
      await http(testApp)
        .post(`${API}/users`)
        .set('Cookie', admin.cookie)
        .send(validUser({ role: 'AGENT' })),
      422,
      'USER_SECTOR_REQUIRED',
    );
    expectErrorEnvelope(
      await http(testApp)
        .post(`${API}/users`)
        .set('Cookie', admin.cookie)
        .send(validUser({ role: 'MANAGER', sectorId: closed.id })),
      422,
      'CATALOG_ITEM_INACTIVE',
    );
  });

  it('accepts exactly the five roles, one per user (AC4.1.9)', async () => {
    const roles = ['STUDENT', 'PROFESSOR', 'AGENT', 'MANAGER', 'ADMIN'];
    for (const [index, role] of roles.entries()) {
      const sectorId = role === 'AGENT' || role === 'MANAGER' ? secretariaId : undefined;
      const response = await http(testApp)
        .post(`${API}/users`)
        .set('Cookie', admin.cookie)
        .send(validUser({ role, sectorId, email: `perfil.${index}@example.test` }))
        .expect(201);
      expect(response.body.role).toBe(role);
    }

    const invalid = await http(testApp)
      .post(`${API}/users`)
      .set('Cookie', admin.cookie)
      .send(validUser({ role: 'GUEST' }));
    const error = expectErrorEnvelope(invalid, 400, 'VALIDATION_FAILED');
    expect(error.details).toEqual([{ field: 'role', code: 'INVALID_VALUE' }]);
  });

  it('reports the violated password rule per field (BR3.4, BR6.3)', async () => {
    const response = await http(testApp)
      .post(`${API}/users`)
      .set('Cookie', admin.cookie)
      .send(validUser({ password: 'somenteletras' }));

    const error = expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
    expect(error.details).toEqual([{ field: 'password', code: 'PASSWORD_MISSING_DIGIT' }]);
  });

  it('reads a user by identifier and answers 404 or 400 otherwise', async () => {
    const student = await createUser(testApp.prisma, { name: 'Dora' });

    const found = await http(testApp)
      .get(`${API}/users/${student.id}`)
      .set('Cookie', admin.cookie)
      .expect(200);

    expect(found.body).toMatchObject({ id: student.id, name: 'Dora' });
    expectErrorEnvelope(
      await http(testApp).get(`${API}/users/${UNKNOWN_ID}`).set('Cookie', admin.cookie),
      404,
      'USER_NOT_FOUND',
    );
    const invalid = expectErrorEnvelope(
      await http(testApp).get(`${API}/users/abc`).set('Cookie', admin.cookie),
      400,
      'VALIDATION_FAILED',
    );
    expect(invalid.details).toEqual([{ field: 'userId', code: 'INVALID_UUID' }]);
  });

  it('updates name, role and sector together (WF5)', async () => {
    const student = await createUser(testApp.prisma);

    const response = await http(testApp)
      .patch(`${API}/users/${student.id}`)
      .set('Cookie', admin.cookie)
      .send({ name: 'Gestora Nova', role: 'MANAGER', sectorId: secretariaId })
      .expect(200);

    expect(response.body).toMatchObject({
      name: 'Gestora Nova',
      role: 'MANAGER',
      sector: { id: secretariaId, name: 'Secretaria' },
    });
    expectErrorEnvelope(
      await http(testApp)
        .patch(`${API}/users/${student.id}`)
        .set('Cookie', admin.cookie)
        .send({ name: null }),
      400,
      'VALIDATION_FAILED',
    );
    expectErrorEnvelope(
      await http(testApp)
        .patch(`${API}/users/${UNKNOWN_ID}`)
        .set('Cookie', admin.cookie)
        .send({ name: 'X' }),
      404,
      'USER_NOT_FOUND',
    );
  });

  it('refuses self deactivation and allows demoting another admin while two remain (BR3.9)', async () => {
    // Through HTTP the actor is always an active ADMIN, so USER_LAST_ACTIVE_ADMIN cannot be
    // reached by a single request; it is verified in the service suite, including concurrency.
    expectErrorEnvelope(
      await http(testApp)
        .patch(`${API}/users/${admin.id}`)
        .set('Cookie', admin.cookie)
        .send({ active: false }),
      422,
      'USER_SELF_MODIFICATION_FORBIDDEN',
    );
    const secondAdmin = await createUser(testApp.prisma, {
      role: 'ADMIN',
      email: 'segunda@example.test',
    });

    const demoted = await http(testApp)
      .patch(`${API}/users/${secondAdmin.id}`)
      .set('Cookie', admin.cookie)
      .send({ role: 'PROFESSOR' })
      .expect(200);

    expect(demoted.body.role).toBe('PROFESSOR');
    expect(await testApp.prisma.user.count({ where: { role: 'ADMIN', active: true } })).toBe(1);
  });

  it('resets a password with 204 and validates it (WF6)', async () => {
    const student = await createUser(testApp.prisma);

    await http(testApp)
      .put(`${API}/users/${student.id}/password`)
      .set('Cookie', admin.cookie)
      .send({ password: 'OutraSenha7' })
      .expect(204);
    expectErrorEnvelope(
      await http(testApp)
        .put(`${API}/users/${student.id}/password`)
        .set('Cookie', admin.cookie)
        .send({ password: '1234567' }),
      400,
      'VALIDATION_FAILED',
    );
    expectErrorEnvelope(
      await http(testApp)
        .put(`${API}/users/${UNKNOWN_ID}/password`)
        .set('Cookie', admin.cookie)
        .send({ password: 'OutraSenha7' }),
      404,
      'USER_NOT_FOUND',
    );
  });
});
