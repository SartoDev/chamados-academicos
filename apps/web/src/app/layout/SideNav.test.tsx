import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Role } from '../api/types';
import { navItemsFor } from '../navigation';
import { SideNav } from './SideNav';

function renderNav(role: Role, path = '/', onNavigate?: () => void) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <SideNav items={navItemsFor(role)} onNavigate={onNavigate} />
    </MemoryRouter>,
  );
}

describe('SideNav (BR7.6, BR7.1)', () => {
  it('is a labelled navigation landmark', () => {
    renderNav('ADMIN');

    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
  });

  it('shows Chamados, Painel and Administração to the administrator', () => {
    renderNav('ADMIN');

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Chamados',
      'Painel',
      'Administração',
    ]);
  });

  it.each([
    ['STUDENT', 'Meus Chamados'],
    ['PROFESSOR', 'Meus Chamados'],
    ['AGENT', 'Fila do Setor'],
    ['MANAGER', 'Fila do Setor'],
  ] as const)('hides Administração from %s and shows their own section', (role, label) => {
    renderNav(role);

    expect(screen.queryByRole('link', { name: 'Administração' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
  });

  it('marks the current item beyond color', () => {
    renderNav('ADMIN', '/admin');

    const link = screen.getByRole('link', { name: 'Administração' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveClass('font-semibold');
  });

  it('does not mark items of other pages', () => {
    renderNav('STUDENT', '/admin');

    expect(screen.getByRole('link', { name: 'Meus Chamados' })).not.toHaveAttribute('aria-current');
  });

  it('reports the choice, e.g. to close the mobile menu', async () => {
    const onNavigate = vi.fn();
    renderNav('ADMIN', '/', onNavigate);

    await userEvent.click(screen.getByRole('link', { name: 'Administração' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('explains when there is no section to show', () => {
    render(
      <MemoryRouter>
        <SideNav items={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Nenhuma seção disponível.')).toBeInTheDocument();
  });
});
