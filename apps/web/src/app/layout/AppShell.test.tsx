import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { makeCurrentUser, page, student } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { ticketOptionRoutes } from '@/test/ticket-fixtures';

/** The entry screen of a requester is now "Meus Chamados" (BR9.1 of U2). */
function renderStudentHome() {
  const api = mockApi({
    'GET /auth/me': { body: student },
    'POST /auth/logout': { status: 204 },
    'GET /tickets': { body: page([]) },
    ...ticketOptionRoutes,
  });
  return { api, ...renderApp('/tickets') };
}

describe('AppShell and TopBar (BR7.1, BR7.2)', () => {
  it('starts with the skip link and marks banner, navigation and main regions', async () => {
    const { user } = renderStudentHome();
    await screen.findByRole('heading', { name: 'Meus Chamados' });

    await user.tab();

    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveFocus();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('links the logo to the entry screen and offers the notification bell', async () => {
    renderStudentHome();
    await screen.findByRole('heading', { name: 'Meus Chamados' });

    expect(screen.getByRole('link', { name: 'Chamados Acadêmicos' })).toHaveAttribute(
      'href',
      '/tickets',
    );
    // U2 replaced the placeholder button with the working bell (BR9.6).
    expect(screen.getByRole('button', { name: 'Notificações: nenhuma não lida' })).toBeEnabled();
  });

  it('collapses and expands the sidebar', async () => {
    const { user } = renderStudentHome();
    await screen.findByRole('heading', { name: 'Meus Chamados' });

    await user.click(screen.getByRole('button', { name: 'Recolher menu' }));
    expect(screen.getByRole('button', { name: 'Expandir menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expandir menu' }));
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
  });

  it('opens the navigation as a menu for narrow screens and closes it after a choice', async () => {
    const { user } = renderStudentHome();
    await screen.findByRole('heading', { name: 'Meus Chamados' });

    await user.click(screen.getByRole('button', { name: 'Abrir menu de navegação' }));
    const menu = await screen.findByRole('dialog', { name: 'Menu' });
    await user.click(within(menu).getByRole('link', { name: 'Meus Chamados' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument(),
    );
  });

  it('signs out from the account menu and returns to the login screen (AC1.1.4)', async () => {
    const { api, user } = renderStudentHome();
    await screen.findByRole('heading', { name: 'Meus Chamados' });

    await user.click(screen.getByRole('button', { name: 'Menu da conta de Ana Souza' }));
    expect(within(await screen.findByRole('menu')).getByText('Aluno')).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Sair' }));

    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent('/login'));
    expect(api.callsTo('POST', '/auth/logout')).toHaveLength(1);
  });

  it('shows the sector of an attending role on its entry screen (BR9.1)', async () => {
    mockApi({
      'GET /auth/me': { body: makeCurrentUser('AGENT', { name: 'Bia' }) },
      'GET /tickets': { body: page([]) },
      ...ticketOptionRoutes,
    });
    renderApp('/queue');

    expect(
      await screen.findByRole('heading', { name: 'Fila do Setor — Secretaria' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Fila do Setor' })).toBeInTheDocument();
  });
});
