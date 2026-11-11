import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PASSWORD_RULES_TEXT } from '@/app/validation/password-policy';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { makeUser } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { ResetPasswordDialog } from './ResetPasswordDialog';

const ana = makeUser('STUDENT', { id: 'u-ana', name: 'Ana' });

function renderDialog(handler: MockHandler = { status: 204 }) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const api = mockApi({ 'PUT /users/u-ana/password': handler });
  const view = renderWithProviders(
    <ResetPasswordDialog user={ana} onClose={onClose} onSaved={onSaved} />,
  );
  return { api, onClose, onSaved, ...view };
}

describe('ResetPasswordDialog (WF6, BR3.4, BR3.7)', () => {
  it('names the person and shows the password rules before sending', () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Redefinir senha de Ana' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toHaveAccessibleDescription(PASSWORD_RULES_TEXT);
  });

  it('refuses a password outside the policy without sending it', async () => {
    const { api, user } = renderDialog();

    await user.type(screen.getByLabelText('Nova senha'), 'abcdefgh');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByText('A senha deve ter ao menos um algarismo.')).toBeInTheDocument();
    expect(api.calls).toHaveLength(0);
  });

  it('replaces the password and reports success', async () => {
    const { api, user, onSaved } = renderDialog();

    await user.type(screen.getByLabelText('Nova senha'), 'NovaSenha9');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.calls[0]?.body).toEqual({ password: 'NovaSenha9' });
  });

  it('shows a server refusal above the buttons', async () => {
    const { user, onSaved } = renderDialog({ status: 404, body: errorBody('USER_NOT_FOUND') });

    await user.type(screen.getByLabelText('Nova senha'), 'NovaSenha9');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário não encontrado.');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('closes on cancel', async () => {
    const { user, onClose } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
  });
});
