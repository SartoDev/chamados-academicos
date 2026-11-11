import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, setUnauthorizedHandler } from '@/app/api/api-client';
import { errorBody, mockApi } from '@/test/api-mock';
import { student } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { fetchCurrentUser, login, logout } from './auth-api';
import { useSession } from './use-session';

function SessionProbe() {
  const session = useSession();
  return (
    <div>
      <output data-testid="user">
        {session.isLoading ? 'loading' : (session.user?.name ?? 'none')}
      </output>
      <output data-testid="expired">{String(session.sessionExpired)}</output>
      <output data-testid="error">{session.error ? 'error' : 'ok'}</output>
      <button type="button" onClick={() => session.signIn(student)}>
        entrar
      </button>
      <button type="button" onClick={() => void session.signOut()}>
        sair
      </button>
      <button type="button" onClick={() => void apiRequest('/users').catch(() => undefined)}>
        consultar
      </button>
      <button type="button" onClick={session.retry}>
        repetir
      </button>
    </div>
  );
}

const renderSession = () => renderWithProviders(<SessionProbe />, { withSession: true });

describe('SessionProvider (WF10, BR1.7)', () => {
  afterEach(() => setUnauthorizedHandler(null));

  it('reads the current session when the app opens', async () => {
    mockApi({ 'GET /auth/me': { body: student } });
    renderSession();

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
  });

  it('has no user and no expiry notice when there is no session', async () => {
    mockApi({ 'GET /auth/me': { status: 401, body: errorBody('UNAUTHENTICATED') } });
    renderSession();

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(screen.getByTestId('expired')).toHaveTextContent('false');
  });

  it('ends the session and flags the expiry when a request answers 401 during use', async () => {
    mockApi({
      'GET /auth/me': { body: student },
      'GET /users': { status: 401, body: errorBody('UNAUTHENTICATED') },
    });
    const { user } = renderSession();
    await screen.findByText('Ana Souza');

    await user.click(screen.getByRole('button', { name: 'consultar' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(screen.getByTestId('expired')).toHaveTextContent('true');
  });

  it('stores the user after sign in', async () => {
    mockApi({ 'GET /auth/me': { status: 401, body: errorBody('UNAUTHENTICATED') } });
    const { user } = renderSession();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));

    await user.click(screen.getByRole('button', { name: 'entrar' }));

    expect(screen.getByTestId('user')).toHaveTextContent('Ana Souza');
  });

  it('signs out, clearing the session even when the logout request fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const api = mockApi({
      'GET /auth/me': { body: student },
      'POST /auth/logout': { status: 500, body: errorBody('INTERNAL_ERROR') },
    });
    const { user } = renderSession();
    await screen.findByText('Ana Souza');

    await user.click(screen.getByRole('button', { name: 'sair' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(api.callsTo('POST', '/auth/logout')).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
  });

  it('exposes a failure to read the session and retries on demand', async () => {
    const api = mockApi({ 'GET /auth/me': { status: 500, body: errorBody('INTERNAL_ERROR') } });
    const { user } = renderSession();
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('error'));

    api.routes['GET /auth/me'] = { body: student };
    await user.click(screen.getByRole('button', { name: 'repetir' }));

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
  });

  it('refuses to be used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<SessionProbe />)).toThrow(
      'useSession must be used inside SessionProvider',
    );
  });
});

describe('auth API', () => {
  it('returns null for no session and rethrows other failures', async () => {
    const api = mockApi({ 'GET /auth/me': { status: 401, body: errorBody('UNAUTHENTICATED') } });
    await expect(fetchCurrentUser()).resolves.toBeNull();

    api.routes['GET /auth/me'] = { status: 503, body: errorBody('INTERNAL_ERROR') };
    await expect(fetchCurrentUser()).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
  });

  it('posts the credentials on login and calls logout', async () => {
    const api = mockApi({
      'POST /auth/login': { body: student },
      'POST /auth/logout': { status: 204 },
    });

    await expect(login({ email: 'ana@example.test', password: 'Senha123' })).resolves.toEqual(
      student,
    );
    await logout();

    expect(api.callsTo('POST', '/auth/login')[0]?.body).toEqual({
      email: 'ana@example.test',
      password: 'Senha123',
    });
    expect(api.callsTo('POST', '/auth/logout')).toHaveLength(1);
  });
});
