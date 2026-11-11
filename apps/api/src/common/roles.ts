/** The five access profiles (BR3.2). English identifiers; Portuguese labels live in the web app. */
export const ROLES = ['STUDENT', 'PROFESSOR', 'AGENT', 'MANAGER', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

/** Roles that always belong to exactly one sector (BR3.3). */
export const SECTOR_ROLES: readonly Role[] = ['AGENT', 'MANAGER'];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function requiresSector(role: Role): boolean {
  return SECTOR_ROLES.includes(role);
}
