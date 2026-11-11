import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { makeUser, page, secretaria } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { UsersTab } from './UsersTab';

const ana = makeUser('STUDENT', { id: 'u-ana', name: 'Ana', email: 'ana@example.test' });
const bia = makeUser('AGENT', { id: 'u-bia', name: 'Bia', email: 'bia@example.test' });
const carlos = makeUser('PROFESSOR', { id: 'u-carlos', name: 'Carlos', active: false });

function renderTab(routes: Record<string, MockHandler> = {}) {
  const api = mockApi({
    'GET /users': { body: page([ana, bia, carlos]) },
    'GET /sectors': { body: page([secretaria]) },
    ...routes,
  });
  return { api, ...renderWithProviders(<UsersTab />) };
}

const row = (name: string) => screen.getByRole('cell', { name }).closest('tr') as HTMLElement;

describe('UsersTab (US4.1)', () => {
  it('lists users with role, sector and situation written as text (AC5.3.4)', async () => {
    renderTab();
    await screen.findByRole('cell', { name: 'Bia' });

    expect(within(row('Bia')).getByText('Atendente')).toBeInTheDocument();
    expect(within(row('Bia')).getByText('Secretaria')).toBeInTheDocument();
    expect(within(row('Bia')).getByText('Ativo')).toBeInTheDocument();
    expect(within(row('Carlos')).getByText('Inativo')).toBeInTheDocument();
  });

  it('filters by role and situation, going back to the first page', async () => {
    const { api, user } = renderTab();
    await screen.findByRole('cell', { name: 'Ana' });

    await user.selectOptions(screen.getByLabelText('Perfil'), 'AGENT');
    await user.selectOptions(screen.getByLabelText('Situação'), 'false');

    await waitFor(() => {
      const last = api.callsTo('GET', '/users').at(-1);
      expect(last?.query.get('role')).toBe('AGENT');
      expect(last?.query.get('active')).toBe('false');
      expect(last?.query.get('page')).toBe('1');
    });
  });

  it('moves to the next page', async () => {
    const { api, user } = renderTab({ 'GET /users': { body: page([ana], { total: 25 }) } });
    await screen.findByText('Mostrando 1–20 de 25');

    await user.click(screen.getByRole('button', { name: 'Próxima' }));

    await waitFor(() => expect(api.callsTo('GET', '/users').at(-1)?.query.get('page')).toBe('2'));
  });

  it('asks for confirmation before deactivating and shows a refusal on the row (BR3.9, BR4.8)', async () => {
    const { api, user } = renderTab({
      'PATCH /users/u-ana': { status: 422, body: errorBody('USER_LAST_ACTIVE_ADMIN') },
    });
    await screen.findByRole('cell', { name: 'Ana' });
    const loads = api.callsTo('GET', '/users').length;

    await user.click(screen.getByRole('button', { name: 'Desativar Ana' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Desativar' }),
    );

    expect(await within(row('Ana')).findByRole('alert')).toHaveTextContent(
      'Não é possível desativar ou rebaixar o último administrador ativo do sistema.',
    );
    expect(api.callsTo('PATCH', '/users/u-ana')[0]?.body).toEqual({ active: false });
    expect(api.callsTo('GET', '/users')).toHaveLength(loads);
  });

  it('deactivates after confirmation and reloads the list; reactivates without confirmation', async () => {
    const { api, user } = renderTab({
      'PATCH /users/u-ana': { body: { ...ana, active: false } },
      'PATCH /users/u-carlos': { body: { ...carlos, active: true } },
    });
    await screen.findByRole('cell', { name: 'Ana' });
    const loads = api.callsTo('GET', '/users').length;

    await user.click(screen.getByRole('button', { name: 'Desativar Ana' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Desativar' }),
    );
    await waitFor(() => expect(api.callsTo('GET', '/users').length).toBeGreaterThan(loads));

    await user.click(screen.getByRole('button', { name: 'Reativar Carlos' }));
    await waitFor(() =>
      expect(api.callsTo('PATCH', '/users/u-carlos')[0]?.body).toEqual({ active: true }),
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('creates a user from the dialog and shows a notice', async () => {
    const { user } = renderTab({ 'POST /users': { status: 201, body: makeUser('STUDENT') } });
    await screen.findByRole('cell', { name: 'Ana' });

    await user.click(screen.getByRole('button', { name: 'Novo usuário' }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo usuário' });
    await user.type(within(dialog).getByLabelText('Nome'), 'Dora');
    await user.type(within(dialog).getByLabelText('E-mail'), 'dora@example.test');
    await user.selectOptions(within(dialog).getByLabelText('Perfil'), 'STUDENT');
    await user.type(within(dialog).getByLabelText('Senha inicial'), 'Senha123');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByTestId('users-tab-notice')).toHaveTextContent('Usuário Dora criado.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the edition and the password reset of a row', async () => {
    const { user } = renderTab({ 'PUT /users/u-ana/password': { status: 204 } });
    await screen.findByRole('cell', { name: 'Ana' });

    await user.click(screen.getByRole('button', { name: 'Editar Ana' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Editar usuário' })).getByRole('button', {
        name: 'Cancelar',
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Redefinir senha de Ana' }));
    const dialog = await screen.findByRole('dialog', { name: 'Redefinir senha de Ana' });
    await user.type(within(dialog).getByLabelText('Nova senha'), 'NovaSenha9');
    await user.click(within(dialog).getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByTestId('users-tab-notice')).toHaveTextContent(
      'Senha de Ana redefinida.',
    );
  });

  it('explains an empty result and offers a retry after a load error', async () => {
    const { api, user } = renderTab({
      'GET /users': { status: 500, body: errorBody('INTERNAL_ERROR') },
    });

    expect(await screen.findByTestId('list-state-error')).toHaveTextContent(
      'Não foi possível carregar os usuários.',
    );
    api.routes['GET /users'] = { body: page([]) };
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(
      await screen.findByText('Nenhum usuário encontrado para os filtros escolhidos.'),
    ).toBeInTheDocument();
  });
});
