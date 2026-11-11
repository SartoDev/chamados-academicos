import type { Actor, Role } from '../../../../src/auth/actor.js';
import type { StatusKey } from '../../../../src/generated/prisma/client.js';
import {
  activeAgentOf,
  activeManagerOf,
  activeStudent,
  createCategory,
  createSector,
  createUser,
} from '../../u1-foundation/support/factories.js';
import { sessionCookie } from '../../u1-foundation/support/http.js';
import { TEST_INITIAL_ADMIN_EMAIL, type TestApp } from '../../u1-foundation/support/test-app.js';

export type ScenarioUser =
  | 'student'
  | 'otherStudent'
  | 'professor'
  | 'agent'
  | 'otherAgent'
  | 'manager'
  | 'financeAgent'
  | 'financeManager'
  | 'admin';

/**
 * Two sectors with their own staff, the catalog items the tickets point at, and one active user
 * per role with a valid session. Everything a ticket suite needs to exercise visibility, the
 * sector queue and transfers between sectors.
 */
export interface TicketScenario {
  sectors: { secretaria: string; financeiro: string };
  categories: { documentos: string; boletos: string; retired: string };
  /** Status identifiers by their stable key (M2). */
  statuses: Record<StatusKey, string>;
  priorities: { baixa: string; normal: string; alta: string };
  users: Record<ScenarioUser, string>;
  names: Record<ScenarioUser, string>;
  cookies: Record<ScenarioUser, string>;
  /** The same people as the actor the guard hands to the services (SVC-01). */
  actors: Record<ScenarioUser, Actor>;
}

const USER_NAMES: Record<ScenarioUser, string> = {
  student: 'Ana Souza',
  otherStudent: 'Bruno Lima',
  professor: 'Professor Carlos',
  agent: 'Atendente Débora',
  otherAgent: 'Atendente Elias',
  manager: 'Gestora Fernanda',
  financeAgent: 'Atendente Gabriel',
  financeManager: 'Gestor Heitor',
  admin: 'Administrador',
};

/** Requires the initial load to have run: statuses and priorities come from it. */
export async function createTicketScenario(testApp: TestApp): Promise<TicketScenario> {
  const { prisma } = testApp;
  const secretaria = await createSector(prisma, { name: 'Secretaria' });
  const financeiro = await createSector(prisma, { name: 'Financeiro' });
  const documentos = await createCategory(prisma, secretaria.id, { name: 'Documentos' });
  const boletos = await createCategory(prisma, financeiro.id, { name: 'Boletos' });
  const retired = await createCategory(prisma, secretaria.id, {
    name: 'Categoria aposentada',
    active: false,
  });

  const statusRows = await prisma.status.findMany({ select: { id: true, key: true } });
  const statuses = Object.fromEntries(
    statusRows.map((status) => [status.key, status.id]),
  ) as Record<StatusKey, string>;
  const priorityRows = await prisma.priority.findMany({ select: { id: true, label: true } });
  const priorityByLabel = (label: string): string => {
    const priority = priorityRows.find((row) => row.label === label);
    if (!priority) {
      throw new Error(`The initial load did not create the priority ${label}`);
    }
    return priority.id;
  };

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: TEST_INITIAL_ADMIN_EMAIL },
    select: { id: true },
  });
  const created: Record<ScenarioUser, string> = {
    student: (await activeStudent(prisma, { name: USER_NAMES.student })).id,
    otherStudent: (await activeStudent(prisma, { name: USER_NAMES.otherStudent })).id,
    professor: (await createUser(prisma, { role: 'PROFESSOR', name: USER_NAMES.professor })).id,
    agent: (await activeAgentOf(prisma, secretaria.id, { name: USER_NAMES.agent })).id,
    otherAgent: (await activeAgentOf(prisma, secretaria.id, { name: USER_NAMES.otherAgent })).id,
    manager: (await activeManagerOf(prisma, secretaria.id, { name: USER_NAMES.manager })).id,
    financeAgent: (await activeAgentOf(prisma, financeiro.id, { name: USER_NAMES.financeAgent }))
      .id,
    financeManager: (
      await activeManagerOf(prisma, financeiro.id, { name: USER_NAMES.financeManager })
    ).id,
    admin: admin.id,
  };

  const cookies = Object.fromEntries(
    Object.entries(created).map(([user, id]) => [user, sessionCookie(testApp, id)]),
  ) as Record<ScenarioUser, string>;

  const roles: Record<ScenarioUser, { role: Role; sectorId: string | null }> = {
    student: { role: 'STUDENT', sectorId: null },
    otherStudent: { role: 'STUDENT', sectorId: null },
    professor: { role: 'PROFESSOR', sectorId: null },
    agent: { role: 'AGENT', sectorId: secretaria.id },
    otherAgent: { role: 'AGENT', sectorId: secretaria.id },
    manager: { role: 'MANAGER', sectorId: secretaria.id },
    financeAgent: { role: 'AGENT', sectorId: financeiro.id },
    financeManager: { role: 'MANAGER', sectorId: financeiro.id },
    admin: { role: 'ADMIN', sectorId: null },
  };
  const actors = Object.fromEntries(
    Object.entries(created).map(([user, id]) => [
      user,
      { id, ...roles[user as ScenarioUser] } satisfies Actor,
    ]),
  ) as Record<ScenarioUser, Actor>;

  return {
    sectors: { secretaria: secretaria.id, financeiro: financeiro.id },
    categories: { documentos: documentos.id, boletos: boletos.id, retired: retired.id },
    statuses,
    priorities: {
      baixa: priorityByLabel('Baixa'),
      normal: priorityByLabel('Normal'),
      alta: priorityByLabel('Alta'),
    },
    users: created,
    names: USER_NAMES,
    cookies,
    actors,
  };
}
