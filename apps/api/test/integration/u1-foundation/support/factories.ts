import { hash } from '@node-rs/argon2';
import type { PrismaService } from '../../../../src/common/prisma/prisma.service.js';
import type { Role } from '../../../../src/generated/prisma/client.js';

/** Password shared by the users created by the factories (fake, test-only). */
export const TEST_USER_PASSWORD = 'Senha12345';

let passwordHashPromise: Promise<string> | undefined;

/** The argon2 hash of TEST_USER_PASSWORD, computed once per test file. */
export function testUserPasswordHash(): Promise<string> {
  passwordHashPromise ??= hash(TEST_USER_PASSWORD);
  return passwordHashPromise;
}

let sequence = 0;
function nextSequence(): number {
  sequence += 1;
  return sequence;
}

export interface SectorOverrides {
  name?: string;
  active?: boolean;
}

export function createSector(prisma: PrismaService, overrides: SectorOverrides = {}) {
  return prisma.sector.create({
    data: { name: overrides.name ?? `Setor ${nextSequence()}`, active: overrides.active ?? true },
  });
}

export interface CategoryOverrides {
  name?: string;
  active?: boolean;
}

export function createCategory(
  prisma: PrismaService,
  sectorId: string,
  overrides: CategoryOverrides = {},
) {
  return prisma.category.create({
    data: {
      name: overrides.name ?? `Categoria ${nextSequence()}`,
      sectorId,
      active: overrides.active ?? true,
    },
  });
}

export interface PriorityOverrides {
  label?: string;
  active?: boolean;
}

export function createPriority(prisma: PrismaService, overrides: PriorityOverrides = {}) {
  return prisma.priority.create({
    data: {
      label: overrides.label ?? `Prioridade ${nextSequence()}`,
      active: overrides.active ?? true,
      isDefault: false,
    },
  });
}

export interface UserOverrides {
  id?: string;
  name?: string;
  email?: string;
  role?: Role;
  sectorId?: string | null;
  active?: boolean;
}

export async function createUser(prisma: PrismaService, overrides: UserOverrides = {}) {
  const n = nextSequence();
  return prisma.user.create({
    data: {
      id: overrides.id,
      name: overrides.name ?? `Pessoa ${n}`,
      email: overrides.email ?? `pessoa.${n}@example.test`,
      role: overrides.role ?? 'STUDENT',
      sectorId: overrides.sectorId ?? null,
      active: overrides.active ?? true,
      passwordHash: await testUserPasswordHash(),
    },
  });
}

export function activeStudent(prisma: PrismaService, overrides: UserOverrides = {}) {
  return createUser(prisma, { role: 'STUDENT', ...overrides });
}

export function activeAdmin(prisma: PrismaService, overrides: UserOverrides = {}) {
  return createUser(prisma, { role: 'ADMIN', ...overrides });
}

export function inactiveAdmin(prisma: PrismaService, overrides: UserOverrides = {}) {
  return createUser(prisma, { role: 'ADMIN', active: false, ...overrides });
}

export function activeAgentOf(
  prisma: PrismaService,
  sectorId: string,
  overrides: UserOverrides = {},
) {
  return createUser(prisma, { role: 'AGENT', sectorId, ...overrides });
}

export function activeManagerOf(
  prisma: PrismaService,
  sectorId: string,
  overrides: UserOverrides = {},
) {
  return createUser(prisma, { role: 'MANAGER', sectorId, ...overrides });
}
