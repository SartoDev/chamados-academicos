import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi } from '@/test/api-mock';
import { administrator, page, student } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { ticketOptionRoutes } from '@/test/ticket-fixtures';

const noSession = { status: 401, body: errorBody('UNAUTHENTICATED') };

async function signIn(user: ReturnType<typeof renderApp>['user']) {
  await user.type(await screen.findByLabelText('E-mail'), 'pessoa@example.test');
  await user.type(screen.getByLabelText('Senha'), 'Senha123');
  await user.click(screen.getByTestId('login-form-submit-button'));
}

describe('LoginPage (Tela 1, BR7.3)', () => {
  it('shows the system name and the form when there is no session', async () => {
    mockApi({ 'GET /auth/me': noSession });
    renderApp('/login');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Chamados Acadêmicos' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page-session-expired')).not.toBeInTheDocument();
  });

  it('explains that the session ended when redirected after expiry', async () => {
    mockApi({ 'GET /auth/me': noSession });
    renderApp({ pathname: '/login', state: { sessionExpired: true } });

    expect(await screen.findByTestId('login-page-session-expired')).toHaveTextContent(
      'Sua sessão terminou. Entre novamente.',
    );
  });

  it('takes an administrator to Administração after signing in (AC1.1.1)', async () => {
    mockApi({
      'GET /auth/me': noSession,
      'POST /auth/login': { body: administrator },
      'GET /users': { body: page([]) },
    });
    const { user } = renderApp('/login');

    await signIn(user);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Administração' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/admin');
  });

  it('takes a requester to Meus Chamados after signing in (BR9.1)', async () => {
    mockApi({
      'GET /auth/me': noSession,
      'POST /auth/login': { body: student },
      'GET /tickets': { body: page([]) },
      ...ticketOptionRoutes,
    });
    const { user } = renderApp('/login');

    await signIn(user);

    expect(await screen.findByRole('heading', { name: 'Meus Chamados' })).toBeInTheDocument();
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/tickets');
  });

  it('sends a signed-in user away from the login screen', async () => {
    mockApi({
      'GET /auth/me': { body: student },
      'GET /tickets': { body: page([]) },
      ...ticketOptionRoutes,
    });
    renderApp('/login');

    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent('/tickets'));
  });
});
