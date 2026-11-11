import type { Role } from '../../../../src/common/roles.js';
import {
  activeAgentOf,
  activeManagerOf,
  createCategory,
  createSector,
  createUser,
} from './factories.js';
import { sessionCookie } from './http.js';
import { TEST_INITIAL_ADMIN_EMAIL, type TestApp } from './test-app.js';

export interface RoleFixtures {
  sectorId: string;
  categoryId: string;
  statusId: string;
  priorityId: string;
  userIds: Record<Role, string>;
  cookies: Record<Role, string>;
}

/** One active user per role (agent and manager in Secretaria) plus catalog items to address. */
export async function createRoleFixtures(testApp: TestApp): Promise<RoleFixtures> {
  const { prisma } = testApp;
  const secretaria = await createSector(prisma, { name: 'Secretaria' });
  const category = await createCategory(prisma, secretaria.id, { name: 'Documentos' });
  const status = await prisma.status.findUniqueOrThrow({ where: { key: 'OPEN' } });
  const priority = await prisma.priority.findUniqueOrThrow({ where: { label: 'Alta' } });
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: TEST_INITIAL_ADMIN_EMAIL } });
  const student = await createUser(prisma, { role: 'STUDENT', name: 'Aluna' });
  const professor = await createUser(prisma, { role: 'PROFESSOR', name: 'Professor' });
  const agent = await activeAgentOf(prisma, secretaria.id, { name: 'Atendente' });
  const manager = await activeManagerOf(prisma, secretaria.id, { name: 'Gestora' });

  const userIds: Record<Role, string> = {
    STUDENT: student.id,
    PROFESSOR: professor.id,
    AGENT: agent.id,
    MANAGER: manager.id,
    ADMIN: admin.id,
  };
  const cookies = Object.fromEntries(
    Object.entries(userIds).map(([role, id]) => [role, sessionCookie(testApp, id)]),
  ) as Record<Role, string>;

  return {
    sectorId: secretaria.id,
    categoryId: category.id,
    statusId: status.id,
    priorityId: priority.id,
    userIds,
    cookies,
  };
}

/** Every U1 row, to prove that a denied request wrote nothing. */
export async function snapshotU1Data(testApp: TestApp): Promise<string> {
  const { prisma } = testApp;
  const rows = await Promise.all([
    prisma.user.findMany({ orderBy: { id: 'asc' } }),
    prisma.sector.findMany({ orderBy: { id: 'asc' } }),
    prisma.category.findMany({ orderBy: { id: 'asc' } }),
    prisma.status.findMany({ orderBy: { id: 'asc' } }),
    prisma.priority.findMany({ orderBy: { id: 'asc' } }),
  ]);
  return JSON.stringify(rows);
}
