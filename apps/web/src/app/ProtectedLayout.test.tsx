import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi, type MockAnswer } from '@/test/api-mock';
import { administrator, page, student } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { ticketOptionRoutes } from '@/test/ticket-fixtures';
import { App } from './App';

const noSession = { status: 401, body: errorBody('UNAUTHENTICATED') };
/** The entry screen of a requester loads their tickets and the notification bell (U2). */
const requesterScreen = { 'GET /tickets': { body: page([]) }, ...ticketOptionRoutes };

describe('ProtectedLayout and routes (BR2.2, BR7.3, WF10)', () => {
  it('shows a loading state while the session is read', async () => {
    mockApi({ 'GET /auth/me': () => new Promise<MockAnswer>(() => undefined) });
    renderApp('/tickets');

    expect(await screen.findByTestId('session-loading')).toHaveTextContent('Carregando...');
  });

  it('sends a visitor without session to the login screen', async () => {
    mockApi({ 'GET /auth/me': noSession });
    renderApp('/tickets');

    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent('/login'));
  });

  it('denies Administração to other roles inside the shell (BR7.6)', async () => {
    mockApi({ 'GET /auth/me': { body: student } });
    renderApp('/admin');

    expect(await screen.findByTestId('access-denied')).toHaveTextContent('Acesso negado');
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('sends "/" to the entry screen of the role', async () => {
    mockApi({
      'GET /auth/me': { body: administrator },
      'GET /users': { body: { items: [], total: 0, page: 1, pageSize: 20 } },
    });
    renderApp('/');

    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent('/admin'));
  });

  it('offers a retry when the session could not be verified', async () => {
    const api = mockApi({
      'GET /auth/me': { status: 500, body: errorBody('INTERNAL_ERROR') },
      ...requesterScreen,
    });
    const { user } = renderApp('/tickets');
    await screen.findByText('Não foi possível verificar sua sessão.');

    api.routes['GET /auth/me'] = { body: student };
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('heading', { name: 'Meus Chamados' })).toBeInTheDocument();
  });

  it('returns to login with a notice when the session ends during use (AC1.1.5)', async () => {
    mockApi({
      'GET /auth/me': { body: administrator },
      'GET /users': { status: 401, body: errorBody('UNAUTHENTICATED') },
    });
    renderApp('/admin');

    expect(await screen.findByTestId('login-page-session-expired')).toBeInTheDocument();
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/login');
  });

  it('shows a not found page for unknown addresses', async () => {
    mockApi({ 'GET /auth/me': noSession });
    renderApp('/nao-existe');

    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
  });

  it('opens the whole application on the login screen when there is no session', async () => {
    window.history.pushState({}, '', '/');
    mockApi({ 'GET /auth/me': noSession });
    render(<App />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Chamados Acadêmicos' }),
    ).toBeInTheDocument();
  });
});
