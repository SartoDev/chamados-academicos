import type {
  Category,
  CurrentUser,
  Page,
  Priority,
  Role,
  Sector,
  Status,
  User,
} from '@/app/api/types';

const TIMESTAMP = '2026-09-01T12:00:00.000Z';

export function page<T>(items: T[], overrides: Partial<Page<T>> = {}): Page<T> {
  return { items, total: items.length, page: 1, pageSize: 20, ...overrides };
}

export const secretaria: Sector = {
  id: 'sector-secretaria',
  name: 'Secretaria',
  active: true,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
};

export const financeiroInactive: Sector = {
  id: 'sector-financeiro',
  name: 'Financeiro',
  active: false,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
};

export function makeCurrentUser(role: Role, overrides: Partial<CurrentUser> = {}): CurrentUser {
  const sector =
    role === 'AGENT' || role === 'MANAGER' ? { id: secretaria.id, name: secretaria.name } : null;
  return {
    id: `user-${role.toLowerCase()}`,
    name: `Pessoa ${role}`,
    email: `${role.toLowerCase()}@example.test`,
    role,
    sector,
    ...overrides,
  };
}

export function makeUser(role: Role, overrides: Partial<User> = {}): User {
  return {
    ...makeCurrentUser(role),
    active: true,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

export const administrator = makeCurrentUser('ADMIN', { name: 'Coordenação' });
export const student = makeCurrentUser('STUDENT', { name: 'Ana Souza' });

export const documentos: Category = {
  id: 'category-documentos',
  name: 'Documentos',
  sector: { id: secretaria.id, name: secretaria.name },
  active: true,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
};

export const statuses: Status[] = [
  { id: 'status-open', key: 'OPEN', label: 'Aberto' },
  { id: 'status-analysis', key: 'IN_ANALYSIS', label: 'Em análise' },
  { id: 'status-waiting', key: 'WAITING_REQUESTER', label: 'Aguardando solicitante' },
  { id: 'status-closed', key: 'CLOSED', label: 'Encerrado' },
];

export const priorities: Priority[] = [
  { id: 'priority-low', label: 'Baixa', isDefault: false, active: true },
  { id: 'priority-normal', label: 'Normal', isDefault: true, active: true },
  { id: 'priority-high', label: 'Alta', isDefault: false, active: true },
];
