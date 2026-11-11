import type { Role } from './api/types';

export interface NavItem {
  id: string;
  label: string;
  to: string;
  roles: readonly Role[];
}

/**
 * Navigation by role (BR9.1, wireframes Tela 2). There is no "Início": every role enters its
 * own working screen, and the logo of the top bar leads back to it.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'my-tickets', label: 'Meus Chamados', to: '/tickets', roles: ['STUDENT', 'PROFESSOR'] },
  { id: 'queue', label: 'Fila do Setor', to: '/queue', roles: ['AGENT', 'MANAGER'] },
  { id: 'all-tickets', label: 'Chamados', to: '/all-tickets', roles: ['ADMIN'] },
  // BR7.5 of U4: indicators for both profiles, and the filtered query inside it for the manager.
  { id: 'reports', label: 'Painel', to: '/reports', roles: ['MANAGER', 'ADMIN'] },
  { id: 'admin', label: 'Administração', to: '/admin', roles: ['ADMIN'] },
];

export function navItemsFor(role: Role, items: readonly NavItem[] = NAV_ITEMS): NavItem[] {
  return items.filter((item) => item.roles.includes(role));
}

/** BR9.1: requesters enter their tickets, the attendance the queue, the administrator the area. */
export function entryPathForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'AGENT':
    case 'MANAGER':
      return '/queue';
    default:
      return '/tickets';
  }
}
