import { verify } from '@node-rs/argon2';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import {
  isForeignKeyViolation,
  isUniqueConstraintViolation,
} from '../../../src/common/prisma/prisma-errors.js';
import {
  INITIAL_ADMIN_NAME,
  INITIAL_PRIORITIES,
  INITIAL_STATUSES,
  InitialLoadError,
} from '../../../src/seed/seed.service.js';
import { resetToInitialLoad, truncateU1Tables } from './support/database.js';
import {
  activeAdmin,
  activeStudent,
  createCategory,
  createPriority,
  createSector,
  createUser,
  inactiveAdmin,
} from './support/factories.js';
import {
  createTestApp,
  TEST_INITIAL_ADMIN_EMAIL,
  TEST_INITIAL_ADMIN_PASSWORD,
  type TestApp,
} from './support/test-app.js';

async function expectRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the operation to be rejected');
}

describe('U1 data model (real PostgreSQL)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
  });

  describe('uniqueness', () => {
    it('keeps e-mails unique and stored in lowercase', async () => {
      const { prisma } = testApp;
      await activeStudent(prisma, { email: 'ana.souza@example.test' });

      const duplicate = await expectRejection(
        activeStudent(prisma, { email: 'ana.souza@example.test' }),
      );
      expect(isUniqueConstraintViolation(duplicate)).toBe(true);

      const uppercase = await expectRejection(
        activeStudent(prisma, { email: 'Bruno.Lima@Example.test' }),
      );
      expect(uppercase).toBeInstanceOf(Error);
      expect(await prisma.user.count({ where: { email: { contains: 'bruno' } } })).toBe(0);
    });

    it('rejects a sector name that differs only by letter case, even when the first is inactive', async () => {
      const { prisma } = testApp;
      await createSector(prisma, { name: 'Secretaria', active: false });

      const error = await expectRejection(createSector(prisma, { name: 'SECRETARIA' }));

      expect(isUniqueConstraintViolation(error)).toBe(true);
    });

    it('keeps category names unique within a sector but allows the same name in another sector', async () => {
      const { prisma } = testApp;
      const secretaria = await createSector(prisma, { name: 'Secretaria' });
      const financeiro = await createSector(prisma, { name: 'Financeiro' });
      await createCategory(prisma, secretaria.id, { name: 'Documentos' });

      const error = await expectRejection(
        createCategory(prisma, secretaria.id, { name: 'documentos' }),
      );
      const sameNameElsewhere = await createCategory(prisma, financeiro.id, { name: 'Documentos' });

      expect(isUniqueConstraintViolation(error)).toBe(true);
      expect(sameNameElsewhere.sectorId).toBe(financeiro.id);
    });

    it('keeps status labels and priority labels unique ignoring letter case', async () => {
      const { prisma } = testApp;

      const statusError = await expectRejection(
        prisma.status.update({ where: { key: 'CLOSED' }, data: { label: 'ABERTO' } }),
      );
      const priorityError = await expectRejection(createPriority(prisma, { label: 'normal' }));

      expect(isUniqueConstraintViolation(statusError)).toBe(true);
      expect(isUniqueConstraintViolation(priorityError)).toBe(true);
    });

    it('allows at most one default priority', async () => {
      const { prisma } = testApp;
      const alta = await prisma.priority.findUniqueOrThrow({ where: { label: 'Alta' } });

      const error = await expectRejection(
        prisma.priority.update({ where: { id: alta.id }, data: { isDefault: true } }),
      );

      expect(isUniqueConstraintViolation(error)).toBe(true);
    });

    it('requires a sector for agents and managers and forbids it for other roles', async () => {
      const { prisma } = testApp;
      const secretaria = await createSector(prisma, { name: 'Secretaria' });

      const agentWithoutSector = await expectRejection(createUser(prisma, { role: 'AGENT' }));
      const studentWithSector = await expectRejection(
        createUser(prisma, { role: 'STUDENT', sectorId: secretaria.id }),
      );
      const manager = await createUser(prisma, { role: 'MANAGER', sectorId: secretaria.id });

      expect(agentWithoutSector).toBeInstanceOf(Error);
      expect(studentWithSector).toBeInstanceOf(Error);
      expect(manager.sectorId).toBe(secretaria.id);
    });

    it('rejects empty sector names and labels at the database level', async () => {
      const { prisma } = testApp;

      const emptySector = await expectRejection(createSector(prisma, { name: '' }));
      const emptyPriority = await expectRejection(createPriority(prisma, { label: '' }));

      expect(emptySector).toBeInstanceOf(Error);
      expect(emptyPriority).toBeInstanceOf(Error);
    });
  });

  describe('foreign keys with ON DELETE RESTRICT', () => {
    it('refuses to delete a sector that still has categories', async () => {
      const { prisma } = testApp;
      const secretaria = await createSector(prisma, { name: 'Secretaria' });
      await createCategory(prisma, secretaria.id);

      const error = await expectRejection(prisma.sector.delete({ where: { id: secretaria.id } }));

      expect(isForeignKeyViolation(error)).toBe(true);
    });

    it('refuses to delete a sector that still has users', async () => {
      const { prisma } = testApp;
      const financeiro = await createSector(prisma, { name: 'Financeiro' });
      await createUser(prisma, { role: 'AGENT', sectorId: financeiro.id });

      const error = await expectRejection(prisma.sector.delete({ where: { id: financeiro.id } }));

      expect(isForeignKeyViolation(error)).toBe(true);
    });

    it('refuses a category that points to a sector that does not exist', async () => {
      const error = await expectRejection(
        createCategory(testApp.prisma, '00000000-0000-4000-8000-00000000abcd'),
      );

      expect(isForeignKeyViolation(error)).toBe(true);
    });
  });

  describe('initial load (BR5.1, BR5.2)', () => {
    it('creates the four statuses, the three priorities with Normal as default and the initial admin', async () => {
      const { prisma } = testApp;

      const statuses = await prisma.status.findMany({ orderBy: { key: 'asc' } });
      const priorities = await prisma.priority.findMany({ orderBy: { createdAt: 'asc' } });
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });

      expect(statuses.map((s) => ({ key: s.key, label: s.label }))).toEqual(INITIAL_STATUSES);
      expect(priorities.map((p) => ({ label: p.label, isDefault: p.isDefault }))).toEqual(
        INITIAL_PRIORITIES,
      );
      expect(priorities.every((p) => p.active)).toBe(true);
      expect(admins).toHaveLength(1);
      expect(admins[0]).toMatchObject({
        name: INITIAL_ADMIN_NAME,
        email: TEST_INITIAL_ADMIN_EMAIL,
        active: true,
      });
    });

    it('stores only a hash of the initial admin password', async () => {
      const admin = await testApp.prisma.user.findUniqueOrThrow({
        where: { email: TEST_INITIAL_ADMIN_EMAIL },
      });

      expect(admin.passwordHash).not.toContain(TEST_INITIAL_ADMIN_PASSWORD);
      expect(admin.passwordHash.startsWith('$argon2id$')).toBe(true);
      expect(await verify(admin.passwordHash, TEST_INITIAL_ADMIN_PASSWORD)).toBe(true);
    });

    it('is idempotent when run twice', async () => {
      const { prisma, seed } = testApp;

      await seed.run();
      await seed.run();

      expect(await prisma.status.count()).toBe(4);
      expect(await prisma.priority.count()).toBe(3);
      expect(await prisma.priority.count({ where: { isDefault: true } })).toBe(1);
      expect(await prisma.user.count({ where: { role: 'ADMIN' } })).toBe(1);
    });

    it('never overwrites a label edited by the administrator', async () => {
      const { prisma, seed } = testApp;
      await prisma.status.update({ where: { key: 'OPEN' }, data: { label: 'Novo' } });
      await prisma.priority.update({ where: { label: 'Alta' }, data: { label: 'Urgente' } });

      await seed.run();

      expect((await prisma.status.findUniqueOrThrow({ where: { key: 'OPEN' } })).label).toBe(
        'Novo',
      );
      expect(await prisma.priority.findUnique({ where: { label: 'Alta' } })).toBeNull();
      expect(await prisma.priority.count()).toBe(3);
    });

    it('recreates a missing status and leaves priorities alone when at least one exists', async () => {
      const { prisma, seed } = testApp;
      await truncateU1Tables(prisma);
      await prisma.status.create({ data: { key: 'OPEN', label: 'Aberto' } });
      await createPriority(prisma, { label: 'Única' });

      await seed.run();

      expect(await prisma.status.count()).toBe(4);
      expect(await prisma.priority.count()).toBe(1);
    });

    it('does not create the initial admin when another active admin exists', async () => {
      const { prisma, seed } = testApp;
      await truncateU1Tables(prisma);
      await activeAdmin(prisma, { email: 'coordenacao@example.test' });

      await seed.run();

      expect(
        await prisma.user.findUnique({ where: { email: TEST_INITIAL_ADMIN_EMAIL } }),
      ).toBeNull();
    });

    it('creates the initial admin when every existing admin is inactive', async () => {
      const { prisma, seed } = testApp;
      await truncateU1Tables(prisma);
      await inactiveAdmin(prisma, { email: 'antiga.coordenacao@example.test' });

      await seed.run();

      const created = await prisma.user.findUnique({ where: { email: TEST_INITIAL_ADMIN_EMAIL } });
      expect(created).toMatchObject({ role: 'ADMIN', active: true });
    });

    it('fails explicitly when the configured e-mail already belongs to another user', async () => {
      const { prisma, seed } = testApp;
      await truncateU1Tables(prisma);
      await activeStudent(prisma, { email: TEST_INITIAL_ADMIN_EMAIL });

      const error = await expectRejection(seed.run());

      expect(error).toBeInstanceOf(InitialLoadError);
      expect((error as Error).message).toContain('INITIAL_ADMIN_EMAIL');
      expect((error as Error).message).not.toContain(TEST_INITIAL_ADMIN_EMAIL);
      expect(await prisma.user.count({ where: { role: 'ADMIN' } })).toBe(0);
    });
  });
});
