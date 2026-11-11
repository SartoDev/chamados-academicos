import type { Role } from './api/types';

export const ROLES: readonly Role[] = ['STUDENT', 'PROFESSOR', 'AGENT', 'MANAGER', 'ADMIN'];

/** Portuguese labels live only in the frontend; the API speaks in stable keys. */
export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Aluno',
  PROFESSOR: 'Professor',
  AGENT: 'Atendente',
  MANAGER: 'Gestor',
  ADMIN: 'Administrador',
};

/** BR3.3: agents and managers belong to exactly one sector. */
export const SECTOR_ROLES: readonly Role[] = ['AGENT', 'MANAGER'];

export function requiresSector(role: Role | '' | undefined): boolean {
  return role !== undefined && role !== '' && SECTOR_ROLES.includes(role);
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
