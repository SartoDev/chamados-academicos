import { verify } from '@node-rs/argon2';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Actor } from '../../../src/auth/actor.js';
import { AppEvents } from '../../../src/common/events/app-events.js';
import { UsersService } from '../../../src/users/users.service.js';
import { expectDomainError } from '../../support/expect-domain-error.js';
import { resetToInitialLoad } from './support/database.js';
import {
  activeAdmin,
  activeAgentOf,
  activeStudent,
  createSector,
  createUser,
  inactiveAdmin,
} from './support/factories.js';
import { createTestApp, TEST_INITIAL_ADMIN_EMAIL, type TestApp } from './support/test-app.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-00000000beef';

describe('UsersService against PostgreSQL (WF4, WF5, WF6)', () => {
  let testApp: TestApp;
  let users: UsersService;
  let initialAdmin: Actor;

  beforeAll(async () => {
    testApp = await createTestApp();
    users = testApp.app.get(UsersService);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    const admin = await testApp.prisma.user.findUniqueOrThrow({
      where: { email: TEST_INITIAL_ADMIN_EMAIL },
    });
    initialAdmin = { id: admin.id, role: 'ADMIN', sectorId: null };
  });

  describe('create', () => {
    it('creates an active user with a normalized e-mail and only a password hash', async () => {
      const created = await users.create({
        name: '  Ana Souza ',
        email: ' Ana.Souza@Example.TEST ',
        role: 'STUDENT',
        password: 'Senha12345',
      });
      const stored = await testApp.prisma.user.findUniqueOrThrow({ where: { id: created.id } });

      expect(created).toMatchObject({
        name: 'Ana Souza',
        email: 'ana.souza@example.test',
        role: 'STUDENT',
        sector: null,
        active: true,
      });
      expect(created).not.toHaveProperty('passwordHash');
      expect(await verify(stored.passwordHash, 'Senha12345')).toBe(true);
    });

    it('requires a sector for agents and managers (BR3.3)', async () => {
      const base = { name: 'Beatriz', password: 'Senha12345' };

      await expectDomainError(
        users.create({ ...base, email: 'b1@example.test', role: 'AGENT' }),
        'USER_SECTOR_REQUIRED',
      );
      await expectDomainError(
        users.create({ ...base, email: 'b2@example.test', role: 'MANAGER', sectorId: null }),
        'USER_SECTOR_REQUIRED',
      );
    });

    it('refuses an unknown or inactive sector', async () => {
      const closed = await createSector(testApp.prisma, {
        name: 'Setor desativado',
        active: false,
      });
      const base = { name: 'Beatriz', role: 'AGENT' as const, password: 'Senha12345' };

      await expectDomainError(
        users.create({ ...base, email: 'b3@example.test', sectorId: UNKNOWN_ID }),
        'CATALOG_ITEM_NOT_FOUND',
      );
      await expectDomainError(
        users.create({ ...base, email: 'b4@example.test', sectorId: closed.id }),
        'CATALOG_ITEM_INACTIVE',
      );
    });

    it('stores no sector for roles without one, even when a sector is sent', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });

      const professor = await users.create({
        name: 'Carlos',
        email: 'carlos@example.test',
        role: 'PROFESSOR',
        password: 'Senha12345',
        sectorId: secretaria.id,
      });

      expect(professor.sector).toBeNull();
    });

    it('refuses an e-mail already used, ignoring case and counting inactive users (BR3.1)', async () => {
      await createUser(testApp.prisma, { email: 'daniela@example.test', active: false });

      await expectDomainError(
        users.create({
          name: 'Daniela',
          email: 'DANIELA@example.test',
          role: 'STUDENT',
          password: 'Senha12345',
        }),
        'USER_EMAIL_TAKEN',
      );
    });
  });

  describe('update', () => {
    it('clears the sector when the role changes to one without sector (BR3.3, BR3.6)', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });
      const agent = await activeAgentOf(testApp.prisma, secretaria.id);

      const updated = await users.update(initialAdmin, agent.id, {
        role: 'STUDENT',
        name: ' Novo nome ',
      });

      expect(updated).toMatchObject({ role: 'STUDENT', sector: null, name: 'Novo nome' });
    });

    it('keeps a sector that was deactivated later but refuses moving a user into an inactive sector', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });
      const financeiro = await createSector(testApp.prisma, { name: 'Financeiro', active: false });
      const agent = await activeAgentOf(testApp.prisma, secretaria.id);
      await testApp.prisma.sector.update({ where: { id: secretaria.id }, data: { active: false } });

      const renamed = await users.update(initialAdmin, agent.id, {
        name: 'Atendente renomeado',
        sectorId: secretaria.id,
      });

      expect(renamed.sector?.id).toBe(secretaria.id);
      await expectDomainError(
        users.update(initialAdmin, agent.id, { sectorId: financeiro.id }),
        'CATALOG_ITEM_INACTIVE',
      );
    });

    it('refuses an administrator deactivating or demoting themselves (BR3.9)', async () => {
      await activeAdmin(testApp.prisma, { email: 'outra.admin@example.test' });

      await expectDomainError(
        users.update(initialAdmin, initialAdmin.id, { active: false }),
        'USER_SELF_MODIFICATION_FORBIDDEN',
      );
      // A role without sector: WF5 applies the sector rule (step 3) before admin protection (step 4).
      await expectDomainError(
        users.update(initialAdmin, initialAdmin.id, { role: 'STUDENT' }),
        'USER_SELF_MODIFICATION_FORBIDDEN',
      );
    });

    it('refuses deactivating or demoting the last active administrator', async () => {
      const retired = await inactiveAdmin(testApp.prisma, { email: 'aposentada@example.test' });
      const acting: Actor = { id: retired.id, role: 'ADMIN', sectorId: null };

      await expectDomainError(
        users.update(acting, initialAdmin.id, { active: false }),
        'USER_LAST_ACTIVE_ADMIN',
      );
      await expectDomainError(
        users.update(acting, initialAdmin.id, { role: 'STUDENT' }),
        'USER_LAST_ACTIVE_ADMIN',
      );
    });

    it('allows demoting an administrator while another active one remains', async () => {
      const second = await activeAdmin(testApp.prisma, { email: 'segunda.admin@example.test' });

      const demoted = await users.update(initialAdmin, second.id, { role: 'PROFESSOR' });

      expect(demoted.role).toBe('PROFESSOR');
    });

    it('never leaves the system without an administrator under concurrent demotions', async () => {
      const second = await activeAdmin(testApp.prisma, { email: 'segunda.admin@example.test' });
      const secondActor: Actor = { id: second.id, role: 'ADMIN', sectorId: null };

      const results = await Promise.allSettled([
        users.update(initialAdmin, second.id, { role: 'STUDENT' }),
        users.update(secondActor, initialAdmin.id, { active: false }),
      ]);

      const rejected = results.filter((result) => result.status === 'rejected');
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
        code: 'USER_LAST_ACTIVE_ADMIN',
      });
      expect(await testApp.prisma.user.count({ where: { role: 'ADMIN', active: true } })).toBe(1);
    });

    it('reactivates a deactivated user and answers USER_NOT_FOUND for unknown users (BR3.8)', async () => {
      const student = await activeStudent(testApp.prisma, { active: false });

      expect((await users.update(initialAdmin, student.id, { active: true })).active).toBe(true);
      await expectDomainError(
        users.update(initialAdmin, UNKNOWN_ID, { name: 'x' }),
        'USER_NOT_FOUND',
      );
      await expectDomainError(
        users.update(initialAdmin, 'not-a-uuid', { name: 'x' }),
        'USER_NOT_FOUND',
      );
    });
  });

  describe('resetPassword', () => {
    it('replaces the hash and announces the reset for the stored e-mail (BR3.7)', async () => {
      const student = await activeStudent(testApp.prisma, { email: 'elisa@example.test' });
      const announced: string[] = [];
      const unsubscribe = testApp.app
        .get(AppEvents)
        .on('user.password-reset', ({ email }) => announced.push(email));

      await users.resetPassword(student.id, 'NovaSenha99');
      unsubscribe();

      const stored = await testApp.prisma.user.findUniqueOrThrow({ where: { id: student.id } });
      expect(await verify(stored.passwordHash, 'NovaSenha99')).toBe(true);
      expect(await verify(stored.passwordHash, 'Senha12345')).toBe(false);
      expect(announced).toEqual(['elisa@example.test']);
    });

    it('answers USER_NOT_FOUND for an unknown user', async () => {
      await expectDomainError(users.resetPassword(UNKNOWN_ID, 'NovaSenha99'), 'USER_NOT_FOUND');
    });
  });

  describe('reads', () => {
    it('lists users with filters, pagination by name and their sector', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });
      await activeAgentOf(testApp.prisma, secretaria.id, { name: 'Zeca' });
      await activeAgentOf(testApp.prisma, secretaria.id, { name: 'Alice', active: false });
      await activeStudent(testApp.prisma, { name: 'Bruno' });

      const agents = await users.list(
        { role: 'AGENT', sectorId: secretaria.id },
        { page: 1, pageSize: 1 },
      );
      const inactive = await users.list({ active: false }, { page: 1, pageSize: 20 });

      expect(agents).toMatchObject({ total: 2, page: 1, pageSize: 1 });
      expect(agents.items.map((user) => user.name)).toEqual(['Alice']);
      expect(agents.items[0]?.sector).toEqual({ id: secretaria.id, name: 'Secretaria' });
      expect(inactive.items.map((user) => user.name)).toEqual(['Alice']);
    });

    it('reads one user and answers USER_NOT_FOUND otherwise', async () => {
      const student = await activeStudent(testApp.prisma);

      expect((await users.getById(student.id)).id).toBe(student.id);
      await expectDomainError(users.getById(UNKNOWN_ID), 'USER_NOT_FOUND');
      await expectDomainError(users.getById('nope'), 'USER_NOT_FOUND');
    });

    it('gives Auth the credentials of a normalized e-mail and the current user', async () => {
      const student = await activeStudent(testApp.prisma, { email: 'fabio@example.test' });

      const credentials = await users.findCredentialsByEmail(' FABIO@example.test ');
      const current = await users.getCurrentUser(student.id);

      expect(credentials).toMatchObject({ id: student.id, active: true });
      expect(current).toEqual({
        id: student.id,
        name: student.name,
        email: 'fabio@example.test',
        role: 'STUDENT',
        sector: null,
      });
      expect(await users.findCredentialsByEmail('ninguem@example.test')).toBeNull();
      await expectDomainError(users.getCurrentUser(UNKNOWN_ID), 'UNAUTHENTICATED');
    });
  });
});
