import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Role, User } from '@/app/api/types';
import { PASSWORD_RULES_TEXT } from '@/app/validation/password-policy';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { financeiroInactive, makeUser, page, secretaria } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { UserFormDialog } from './UserFormDialog';

function renderDialog(options: { user?: User; routes?: Record<string, MockHandler> } = {}) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const api = mockApi({
    'GET /sectors': { body: page([secretaria]) },
    'POST /users': (request) => ({
      status: 201,
      body: makeUser((request.body as { role: Role }).role),
    }),
    ...options.routes,
  });
  const view = renderWithProviders(
    <UserFormDialog user={options.user} onClose={onClose} onSaved={onSaved} />,
  );
  return { api, onClose, onSaved, ...view };
}

async function fillNewUser(
  user: ReturnType<typeof renderDialog>['user'],
  role: Role,
  password = 'Senha123',
) {
  await user.type(screen.getByLabelText('Nome'), 'Nova Pessoa');
  await user.type(screen.getByLabelText('E-mail'), 'nova.pessoa@example.test');
  await user.selectOptions(screen.getByLabelText('Perfil'), role);
  await user.type(screen.getByLabelText('Senha inicial'), password);
}

describe('UserFormDialog (WF4, WF5, BR3.1 to BR3.4)', () => {
  it('offers exactly the five roles (AC4.1.9)', () => {
    renderDialog();

    const options = within(screen.getByLabelText('Perfil')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Selecione',
      'Aluno',
      'Professor',
      'Atendente',
      'Gestor',
      'Administrador',
    ]);
  });

  it('asks for a sector only for Atendente and Gestor (BR3.3)', async () => {
    const { user } = renderDialog();
    const role = screen.getByLabelText('Perfil');

    await user.selectOptions(role, 'STUDENT');
    expect(screen.queryByLabelText('Setor')).not.toBeInTheDocument();

    await user.selectOptions(role, 'AGENT');
    expect(await screen.findByRole('option', { name: 'Secretaria' })).toBeInTheDocument();
    expect(screen.getByLabelText('Setor')).toHaveAccessibleDescription(
      'Obrigatório para Atendente e Gestor.',
    );

    await user.selectOptions(role, 'MANAGER');
    expect(screen.getByLabelText('Setor')).toBeInTheDocument();

    await user.selectOptions(role, 'ADMIN');
    expect(screen.queryByLabelText('Setor')).not.toBeInTheDocument();
  });

  it('refuses an agent without sector before sending anything (AC4.1.6)', async () => {
    const { user, api } = renderDialog();
    await fillNewUser(user, 'AGENT');

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Escolha o setor do atendente ou gestor.')).toBeInTheDocument();
    expect(api.callsTo('POST', '/users')).toHaveLength(0);
  });

  it('shows the password rules and validates them when leaving the field (BR3.4)', async () => {
    const { user } = renderDialog();
    const password = screen.getByLabelText('Senha inicial');
    expect(password).toHaveAccessibleDescription(PASSWORD_RULES_TEXT);

    await user.type(password, 'abc');
    await user.tab();

    expect(
      await screen.findByText('A senha deve ter pelo menos 8 caracteres.'),
    ).toBeInTheDocument();
  });

  it('creates a student without sending a sector, and an agent with the chosen sector', async () => {
    const { user, api, onSaved } = renderDialog();
    await fillNewUser(user, 'STUDENT');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Usuário Nova Pessoa criado.'));
    expect(api.callsTo('POST', '/users')[0]?.body).toEqual({
      name: 'Nova Pessoa',
      email: 'nova.pessoa@example.test',
      role: 'STUDENT',
      password: 'Senha123',
    });

    await user.selectOptions(screen.getByLabelText('Perfil'), 'AGENT');
    await user.selectOptions(await screen.findByLabelText('Setor'), secretaria.id);
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(api.callsTo('POST', '/users')).toHaveLength(2));
    expect(api.callsTo('POST', '/users')[1]?.body).toMatchObject({
      role: 'AGENT',
      sectorId: secretaria.id,
    });
  });

  it('shows a conflict above the buttons and keeps what was typed', async () => {
    const { user, onSaved } = renderDialog({
      routes: { 'POST /users': { status: 409, body: errorBody('USER_EMAIL_TAKEN') } },
    });
    await fillNewUser(user, 'PROFESSOR');

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Já existe um usuário com este e-mail.',
    );
    expect(screen.getByLabelText('Nome')).toHaveValue('Nova Pessoa');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('places server field errors next to the fields', async () => {
    const { user } = renderDialog({
      routes: {
        'POST /users': {
          status: 400,
          body: errorBody('VALIDATION_FAILED', [{ field: 'email', code: 'INVALID_EMAIL' }]),
        },
      },
    });
    await fillNewUser(user, 'STUDENT');

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('edits name and role, clearing the sector of a role without sector', async () => {
    const agent = makeUser('AGENT', { id: 'user-bia', name: 'Bia' });
    const { user, api, onSaved } = renderDialog({
      user: agent,
      routes: { 'PATCH /users/user-bia': { body: makeUser('PROFESSOR') } },
    });
    expect(screen.getByText(agent.email)).toBeInTheDocument();
    expect(screen.queryByLabelText('Senha inicial')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Perfil'), 'PROFESSOR');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Usuário Bia atualizado.'));
    expect(api.callsTo('PATCH', '/users/user-bia')[0]?.body).toEqual({
      name: 'Bia',
      role: 'PROFESSOR',
      sectorId: null,
    });
  });

  it('keeps an inactive current sector selectable and cancels on request', async () => {
    const agent = makeUser('AGENT', {
      sector: { id: financeiroInactive.id, name: financeiroInactive.name },
    });
    const { user, onClose } = renderDialog({ user: agent });

    expect(await screen.findByRole('option', { name: 'Financeiro (inativo)' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
  });
});
