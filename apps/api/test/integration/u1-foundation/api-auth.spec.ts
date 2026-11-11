import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { MAX_FAILED_ATTEMPTS } from '../../../src/auth/login-attempt-limiter.js';
import { SESSION_DURATION_SECONDS } from '../../../src/auth/session-cookie.js';
import { ONE_HOUR_MS } from '../../support/fake-clock.js';
import { resetToInitialLoad } from './support/database.js';
import { createUser, TEST_USER_PASSWORD } from './support/factories.js';
import {
  API,
  expectErrorEnvelope,
  http,
  sessionCookie,
  sessionCookieFrom,
  setCookieHeaders,
} from './support/http.js';
import {
  createTestApp,
  TEST_APP_ORIGIN,
  TEST_INITIAL_ADMIN_EMAIL,
  TEST_INITIAL_ADMIN_PASSWORD,
  type TestApp,
} from './support/test-app.js';

describe('API-U1 authentication and session (US1.1, US4.1)', () => {
  let testApp: TestApp;

  const login = (email: string, password: string) =>
    http(testApp).post(`${API}/auth/login`).send({ email, password });

  async function adminCookie(): Promise<string> {
    const response = await login(TEST_INITIAL_ADMIN_EMAIL, TEST_INITIAL_ADMIN_PASSWORD);
    return sessionCookieFrom(response);
  }

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
  });

  it('signs an active user in, returns the current user and sets a protected cookie (AC1.1.1, AC1.1.7)', async () => {
    const student = await createUser(testApp.prisma, { role: 'STUDENT', name: 'Ana' });

    const response = await login(student.email.toUpperCase(), TEST_USER_PASSWORD).expect(200);

    expect(response.body).toEqual({
      id: student.id,
      name: 'Ana',
      email: student.email,
      role: 'STUDENT',
      sector: null,
    });
    const cookie = setCookieHeaders(response).find((value) => value.startsWith('session='));
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/api');
    expect(cookie).toContain(`Max-Age=${SESSION_DURATION_SECONDS}`);
    expect(cookie).not.toContain('Secure');

    const me = await http(testApp)
      .get(`${API}/auth/me`)
      .set('Cookie', sessionCookieFrom(response))
      .expect(200);
    expect(me.body.id).toBe(student.id);
  });

  it('answers unknown e-mail, wrong password and inactive user identically (AC1.1.2, AC1.1.3)', async () => {
    const active = await createUser(testApp.prisma, { role: 'PROFESSOR' });
    const inactive = await createUser(testApp.prisma, { role: 'STUDENT', active: false });

    const responses = await Promise.all([
      login('ninguem@example.test', TEST_USER_PASSWORD),
      login(active.email, 'SenhaErrada1'),
      login(inactive.email, TEST_USER_PASSWORD),
    ]);

    const comparable = responses.map((response) => {
      const error = expectErrorEnvelope(response, 401, 'AUTH_INVALID_CREDENTIALS');
      expect(setCookieHeaders(response)).toEqual([]);
      return { message: error.message, details: error.details };
    });
    expect(comparable[1]).toEqual(comparable[0]);
    expect(comparable[2]).toEqual(comparable[0]);
  });

  it('refuses the sixth attempt with 429 and Retry-After, even with the right password (BR1.4)', async () => {
    const student = await createUser(testApp.prisma);
    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      await login(student.email, 'SenhaErrada1').expect(401);
    }

    const blocked = await login(student.email, TEST_USER_PASSWORD);

    const error = expectErrorEnvelope(blocked, 429, 'AUTH_TOO_MANY_ATTEMPTS');
    expect(error.details).toEqual({ retryAfterSeconds: 900 });
    expect(blocked.headers['retry-after']).toBe('900');
  });

  it('does not count malformed login requests as credential failures', async () => {
    const student = await createUser(testApp.prisma);
    for (let attempt = 0; attempt <= MAX_FAILED_ATTEMPTS; attempt += 1) {
      const response = await http(testApp)
        .post(`${API}/auth/login`)
        .send({ email: student.email, password: '' });
      expectErrorEnvelope(response, 400, 'VALIDATION_FAILED');
    }

    await login(student.email, TEST_USER_PASSWORD).expect(200);
  });

  it('logs out with 204, clearing the cookie with or without a session (AC1.1.4, BR1.6)', async () => {
    const student = await createUser(testApp.prisma);
    const cookie = sessionCookieFrom(await login(student.email, TEST_USER_PASSWORD));

    const withSession = await http(testApp)
      .post(`${API}/auth/logout`)
      .set('Cookie', cookie)
      .expect(204);
    const withoutSession = await http(testApp).post(`${API}/auth/logout`).expect(204);

    for (const response of [withSession, withoutSession]) {
      const cleared = setCookieHeaders(response).find((value) => value.startsWith('session=;'));
      expect(cleared).toContain('Path=/api');
      expect(cleared).toContain('Expires=Thu, 01 Jan 1970');
    }
    const afterLogout = await http(testApp).get(`${API}/auth/me`);
    expectErrorEnvelope(afterLogout, 401, 'UNAUTHENTICATED');
  });

  it('refuses a session once its 8 hours are over (AC1.1.5, BR1.5, BR1.7)', async () => {
    const student = await createUser(testApp.prisma);
    const cookie = sessionCookie(testApp, student.id);

    testApp.clock.advanceBy(8 * ONE_HOUR_MS - 1000);
    await http(testApp).get(`${API}/auth/me`).set('Cookie', cookie).expect(200);

    testApp.clock.advanceBy(1000);
    expectErrorEnvelope(
      await http(testApp).get(`${API}/auth/me`).set('Cookie', cookie),
      401,
      'UNAUTHENTICATED',
    );
  });

  it('ends the session of a deactivated user on the next request and refuses a new login (AC4.1.5)', async () => {
    const student = await createUser(testApp.prisma);
    const cookie = sessionCookieFrom(await login(student.email, TEST_USER_PASSWORD));
    await http(testApp).get(`${API}/auth/me`).set('Cookie', cookie).expect(200);

    await http(testApp)
      .patch(`${API}/users/${student.id}`)
      .set('Cookie', await adminCookie())
      .send({ active: false })
      .expect(200);

    expectErrorEnvelope(
      await http(testApp).get(`${API}/auth/me`).set('Cookie', cookie),
      401,
      'UNAUTHENTICATED',
    );
    expectErrorEnvelope(
      await login(student.email, TEST_USER_PASSWORD),
      401,
      'AUTH_INVALID_CREDENTIALS',
    );
  });

  it('applies a role change on the next request of that user (AC4.1.3)', async () => {
    const student = await createUser(testApp.prisma);
    const cookie = sessionCookie(testApp, student.id);
    expectErrorEnvelope(
      await http(testApp).get(`${API}/users`).set('Cookie', cookie),
      403,
      'FORBIDDEN',
    );

    await http(testApp)
      .patch(`${API}/users/${student.id}`)
      .set('Cookie', await adminCookie())
      .send({ role: 'ADMIN' })
      .expect(200);

    await http(testApp).get(`${API}/users`).set('Cookie', cookie).expect(200);
  });

  it('refuses the previous password after a reset and lifts an existing block (AC4.1.4, BR3.7)', async () => {
    const student = await createUser(testApp.prisma);
    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      await login(student.email, 'SenhaErrada1').expect(401);
    }

    await http(testApp)
      .put(`${API}/users/${student.id}/password`)
      .set('Cookie', await adminCookie())
      .send({ password: 'NovaSenha2026' })
      .expect(204);

    await login(student.email, 'NovaSenha2026').expect(200);
    expectErrorEnvelope(
      await login(student.email, TEST_USER_PASSWORD),
      401,
      'AUTH_INVALID_CREDENTIALS',
    );
  });

  it('returns only the session owner from the current session operation (AC5.1.2)', async () => {
    const ana = await createUser(testApp.prisma, { name: 'Ana' });
    await createUser(testApp.prisma, { name: 'Bruno' });

    const response = await http(testApp)
      .get(`${API}/auth/me`)
      .set('Cookie', sessionCookie(testApp, ana.id))
      .expect(200);

    expect(response.body).toEqual({
      id: ana.id,
      name: 'Ana',
      email: ana.email,
      role: 'STUDENT',
      sector: null,
    });
  });

  it('refuses a login posted from another origin and accepts it from the system origin (BR2.6)', async () => {
    const student = await createUser(testApp.prisma);

    const foreign = await http(testApp)
      .post(`${API}/auth/login`)
      .set('Origin', 'https://evil.example')
      .send({ email: student.email, password: TEST_USER_PASSWORD });
    const same = await http(testApp)
      .post(`${API}/auth/login`)
      .set('Origin', TEST_APP_ORIGIN)
      .send({ email: student.email, password: TEST_USER_PASSWORD });

    expectErrorEnvelope(foreign, 403, 'FORBIDDEN');
    expect(setCookieHeaders(foreign)).toEqual([]);
    expect(same.status).toBe(200);
  });

  it('offers no password recovery nor self sign-up operation (AC1.1.6, AC4.1.8)', async () => {
    for (const path of ['/auth/forgot-password', '/auth/register', '/auth/signup']) {
      expectErrorEnvelope(await http(testApp).post(`${API}${path}`).send({}), 404, 'NOT_FOUND');
    }
  });

  describe('when served over HTTPS (COOKIE_SECURE=true)', () => {
    let secureApp: TestApp;

    beforeAll(async () => {
      secureApp = await createTestApp({ env: { COOKIE_SECURE: 'true' } });
    });

    afterAll(async () => {
      await secureApp.close();
    });

    it('marks the session cookie Secure', async () => {
      const response = await http(secureApp)
        .post(`${API}/auth/login`)
        .send({ email: TEST_INITIAL_ADMIN_EMAIL, password: TEST_INITIAL_ADMIN_PASSWORD })
        .expect(200);

      expect(setCookieHeaders(response).find((value) => value.startsWith('session='))).toContain(
        'Secure',
      );
    });
  });
});
