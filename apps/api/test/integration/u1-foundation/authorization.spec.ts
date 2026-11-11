import { Controller, Get } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Role } from '../../../src/common/roles.js';
import { resetToInitialLoad } from './support/database.js';
import { API, expectErrorEnvelope, http } from './support/http.js';
import { createRoleFixtures, snapshotU1Data, type RoleFixtures } from './support/role-fixtures.js';
import { createTestApp, TEST_APP_ORIGIN, type TestApp } from './support/test-app.js';

const ALL: Role[] = ['STUDENT', 'PROFESSOR', 'AGENT', 'MANAGER', 'ADMIN'];
const ADMIN_ONLY: Role[] = ['ADMIN'];

type Method = 'get' | 'post' | 'patch' | 'put';

interface Operation {
  id: string;
  method: Method;
  path: (f: RoleFixtures) => string;
  body?: (f: RoleFixtures) => object;
  allowed: Role[];
}

/** BR2.7: role matrix of every non-public operation of API-U1. */
const OPERATIONS: Operation[] = [
  { id: 'getCurrentUser', method: 'get', path: () => '/auth/me', allowed: ALL },
  { id: 'listUsers', method: 'get', path: () => '/users', allowed: ADMIN_ONLY },
  {
    id: 'createUser',
    method: 'post',
    path: () => '/users',
    body: () => ({
      name: 'Nova',
      email: 'nova@example.test',
      role: 'STUDENT',
      password: 'Senha12345',
    }),
    allowed: ADMIN_ONLY,
  },
  { id: 'getUser', method: 'get', path: (f) => `/users/${f.userIds.STUDENT}`, allowed: ADMIN_ONLY },
  {
    id: 'updateUser',
    method: 'patch',
    path: (f) => `/users/${f.userIds.PROFESSOR}`,
    body: () => ({ name: 'Renomeado' }),
    allowed: ADMIN_ONLY,
  },
  {
    id: 'resetUserPassword',
    method: 'put',
    path: (f) => `/users/${f.userIds.PROFESSOR}/password`,
    body: () => ({ password: 'Trocada123' }),
    allowed: ADMIN_ONLY,
  },
  { id: 'listSectors', method: 'get', path: () => '/sectors', allowed: ALL },
  {
    id: 'createSector',
    method: 'post',
    path: () => '/sectors',
    body: () => ({ name: 'Novo setor' }),
    allowed: ADMIN_ONLY,
  },
  {
    id: 'updateSector',
    method: 'patch',
    path: (f) => `/sectors/${f.sectorId}`,
    body: () => ({ name: 'Secretaria Geral' }),
    allowed: ADMIN_ONLY,
  },
  { id: 'listCategories', method: 'get', path: () => '/categories', allowed: ALL },
  {
    id: 'createCategory',
    method: 'post',
    path: () => '/categories',
    body: (f) => ({ name: 'Nova categoria', sectorId: f.sectorId }),
    allowed: ADMIN_ONLY,
  },
  {
    id: 'updateCategory',
    method: 'patch',
    path: (f) => `/categories/${f.categoryId}`,
    body: () => ({ active: false }),
    allowed: ADMIN_ONLY,
  },
  { id: 'listStatuses', method: 'get', path: () => '/statuses', allowed: ALL },
  {
    id: 'updateStatus',
    method: 'patch',
    path: (f) => `/statuses/${f.statusId}`,
    body: () => ({ label: 'Novo rótulo' }),
    allowed: ADMIN_ONLY,
  },
  { id: 'listPriorities', method: 'get', path: () => '/priorities', allowed: ALL },
  {
    id: 'createPriority',
    method: 'post',
    path: () => '/priorities',
    body: () => ({ label: 'Urgente' }),
    allowed: ADMIN_ONLY,
  },
  {
    id: 'updatePriority',
    method: 'patch',
    path: (f) => `/priorities/${f.priorityId}`,
    body: () => ({ label: 'Muito alta' }),
    allowed: ADMIN_ONLY,
  },
];

@Controller('test-probes')
class UnmarkedProbeController {
  @Get('unmarked')
  unmarked(): { reached: boolean } {
    return { reached: true };
  }
}

describe('API-U1 authorization (US5.1, NFR2, BR2.1 to BR2.7)', () => {
  let testApp: TestApp;
  let fixtures: RoleFixtures;

  function call(operation: Operation, cookie?: string) {
    const request = http(testApp)[operation.method](`${API}${operation.path(fixtures)}`);
    if (cookie) {
      request.set('Cookie', cookie);
    }
    return operation.body ? request.send(operation.body(fixtures)) : request;
  }

  beforeAll(async () => {
    testApp = await createTestApp({ controllers: [UnmarkedProbeController] });
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    fixtures = await createRoleFixtures(testApp);
  });

  describe.each(OPERATIONS)('$id', (operation) => {
    const denied = ALL.filter((role) => !operation.allowed.includes(role));

    it('answers 401 without a session (BR1.7)', async () => {
      expectErrorEnvelope(await call(operation), 401, 'UNAUTHENTICATED');
    });

    it(`answers 403 without any resource data for ${denied.length ? denied.join(', ') : 'no role (open to every authenticated role)'}`, async () => {
      const before = await snapshotU1Data(testApp);
      for (const role of denied) {
        expectErrorEnvelope(await call(operation, fixtures.cookies[role]), 403, 'FORBIDDEN');
      }
      expect(await snapshotU1Data(testApp)).toBe(before);
    });

    it(`lets ${operation.allowed.join(', ')} through`, async () => {
      for (const role of operation.allowed) {
        const response = await call(operation, fixtures.cookies[role]);
        expect([200, 201, 204]).toContain(response.status);
      }
    });
  });

  it('denies a route without role marker to every role, even the administrator (AC5.1.3, BR2.1)', async () => {
    for (const role of ALL) {
      const response = await http(testApp)
        .get(`${API}/test-probes/unmarked`)
        .set('Cookie', fixtures.cookies[role]);
      expectErrorEnvelope(response, 403, 'FORBIDDEN');
      expect(response.body).not.toHaveProperty('reached');
    }
  });

  it('never gives a non-administrator the data of another user (AC5.1.2, BR2.5, IDOR)', async () => {
    for (const role of ALL.filter((r) => r !== 'ADMIN')) {
      const otherUserId =
        role === 'STUDENT' ? fixtures.userIds.PROFESSOR : fixtures.userIds.STUDENT;
      const response = await http(testApp)
        .get(`${API}/users/${otherUserId}`)
        .set('Cookie', fixtures.cookies[role]);
      expectErrorEnvelope(response, 403, 'FORBIDDEN');

      const me = await http(testApp)
        .get(`${API}/auth/me`)
        .set('Cookie', fixtures.cookies[role])
        .expect(200);
      expect(me.body.id).toBe(fixtures.userIds[role]);
    }
  });

  it('refuses state-changing requests from another origin without executing them (BR2.6)', async () => {
    const before = await snapshotU1Data(testApp);

    const foreign = await http(testApp)
      .post(`${API}/sectors`)
      .set('Origin', 'https://evil.example')
      .set('Cookie', fixtures.cookies.ADMIN)
      .send({ name: 'Invasor' });

    expectErrorEnvelope(foreign, 403, 'FORBIDDEN');
    expect(await snapshotU1Data(testApp)).toBe(before);
    await http(testApp)
      .post(`${API}/sectors`)
      .set('Origin', TEST_APP_ORIGIN)
      .set('Cookie', fixtures.cookies.ADMIN)
      .send({ name: 'Legítimo' })
      .expect(201);
    await http(testApp)
      .get(`${API}/sectors`)
      .set('Origin', 'https://evil.example')
      .set('Cookie', fixtures.cookies.STUDENT)
      .expect(200);
  });
});
