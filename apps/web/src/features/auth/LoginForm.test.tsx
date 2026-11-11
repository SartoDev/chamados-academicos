import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { errorBody, mockApi, type MockAnswer } from '@/test/api-mock';
import { student } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { LoginForm } from './LoginForm';

function renderForm() {
  const onSuccess = vi.fn();
  const view = renderWithProviders(<LoginForm onSuccess={onSuccess} />);
  return { onSuccess, ...view };
}

const emailInput = () => screen.getByLabelText('E-mail');
const passwordInput = () => screen.getByLabelText('Senha');
const submitButton = () => screen.getByTestId('login-form-submit-button');

describe('LoginForm (US1.1)', () => {
  it('has visible labels, focuses the e-mail first and offers no password recovery (AC1.1.6)', () => {
    renderForm();

    expect(emailInput()).toHaveFocus();
    expect(passwordInput()).toHaveAttribute('type', 'password');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/esqueci/i)).not.toBeInTheDocument();
  });

  it('keeps the submit button disabled until both fields are filled', async () => {
    const { user } = renderForm();
    expect(submitButton()).toBeDisabled();

    await user.type(emailInput(), 'ana.souza@example.test');
    expect(submitButton()).toBeDisabled();

    await user.type(passwordInput(), 'Senha123');
    expect(submitButton()).toBeEnabled();
  });

  it('validates the e-mail when leaving the field', async () => {
    const { user } = renderForm();

    await user.type(emailInput(), 'sem-arroba');
    await user.tab();

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(emailInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows one message for refused credentials and keeps what was typed (BR1.2)', async () => {
    mockApi({ 'POST /auth/login': { status: 401, body: errorBody('AUTH_INVALID_CREDENTIALS') } });
    const { user, onSuccess } = renderForm();

    await user.type(emailInput(), 'ana.souza@example.test');
    await user.type(passwordInput(), 'SenhaErrada1');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    expect(emailInput()).toHaveValue('ana.souza@example.test');
    expect(passwordInput()).toHaveValue('SenhaErrada1');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('tells how long to wait after too many attempts (BR1.4)', async () => {
    mockApi({
      'POST /auth/login': {
        status: 429,
        body: errorBody('AUTH_TOO_MANY_ATTEMPTS', { retryAfterSeconds: 600 }),
      },
    });
    const { user } = renderForm();

    await user.type(emailInput(), 'ana.souza@example.test');
    await user.type(passwordInput(), 'Senha123');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Tente novamente em 10 minutos.');
  });

  it('shows "Entrando..." with read-only fields while sending, then hands over the user', async () => {
    let release: (answer: MockAnswer) => void = () => undefined;
    const api = mockApi({
      'POST /auth/login': () => new Promise<MockAnswer>((resolve) => (release = resolve)),
    });
    const { user, onSuccess } = renderForm();

    await user.type(emailInput(), ' ana.souza@example.test');
    await user.type(passwordInput(), 'Senha123');
    await user.click(submitButton());

    expect(await screen.findByRole('button', { name: 'Entrando...' })).toBeDisabled();
    expect(emailInput()).toHaveAttribute('readonly');
    release({ body: student });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onSuccess.mock.calls[0]?.[0]).toEqual(student);
    expect(api.callsTo('POST', '/auth/login')[0]?.body).toEqual({
      email: 'ana.souza@example.test',
      password: 'Senha123',
    });
  });

  it('reveals and hides the password on demand', async () => {
    const { user } = renderForm();
    const toggle = screen.getByRole('button', { name: 'Mostrar senha' });

    await user.click(toggle);
    expect(passwordInput()).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(passwordInput()).toHaveAttribute('type', 'password');
  });
});
