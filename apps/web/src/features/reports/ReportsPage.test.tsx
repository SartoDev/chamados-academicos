import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app/AppRoutes';
import { mockApi, type MockHandler } from '@/test/api-mock';
import { makeCurrentUser } from '@/test/fixtures';
import { renderWithProviders, type TestRoute } from '@/test/render';
import { reportRoutes } from '@/test/report-fixtures';

/** Exposes the query string, which is where the chosen period lives (BR7.2). */
function SearchProbe() {
  return <output data-testid="search-probe">{useLocation().search}</output>;
}

const manager = makeCurrentUser('MANAGER');
const administrator = makeCurrentUser('ADMIN');

function renderReports(
  user = manager,
  route: TestRoute = '/reports',
  routes: Record<string, MockHandler> = {},
) {
  const api = mockApi({
    'GET /auth/me': { body: user },
    ...reportRoutes,
    ...routes,
  });
  return {
    api,
    ...renderWithProviders(
      <>
        <AppRoutes />
        <SearchProbe />
      </>,
      { route, withSession: true },
    ),
  };
}

const lastCountsQuery = (api: ReturnType<typeof renderReports>['api']) =>
  api.callsTo('GET', '/reports/ticket-counts').at(-1)?.query;

describe('ReportsPage (Tela 9, US6.1, BR7.5)', () => {
  it('offers the panel in the navigation of the manager and opens on the indicators', async () => {
    renderReports();

    expect(await screen.findByRole('heading', { name: 'Painel' })).toBeInTheDocument();
    expect(screen.getByTestId('side-nav-link-reports')).toHaveTextContent('Painel');
    expect(screen.getByRole('tab', { name: 'Indicadores' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('shows the Consulta tab to the manager and hides it from the administrator (BR1.1)', async () => {
    const { unmount } = renderReports();
    expect(await screen.findByRole('tab', { name: 'Consulta' })).toBeInTheDocument();
    unmount();

    renderReports(administrator);

    await screen.findByRole('tab', { name: 'Indicadores' });
    expect(screen.queryByRole('tab', { name: 'Consulta' })).not.toBeInTheDocument();
  });

  it('keeps a requester away from the panel, whatever the navigation shows', async () => {
    renderReports(makeCurrentUser('STUDENT'));

    expect(await screen.findByTestId('access-denied')).toBeInTheDocument();
    expect(screen.queryByTestId('side-nav-link-reports')).not.toBeInTheDocument();
  });

  it('asks for the last thirty days when the address carries no period (BR7.2)', async () => {
    const { api } = renderReports();
    await screen.findByTestId('indicators-tab');

    const query = lastCountsQuery(api);
    const from = new Date(query?.get('from') ?? '');
    const to = new Date(query?.get('to') ?? '');
    expect(Math.round((to.getTime() - from.getTime()) / 86_400_000)).toBe(30);
  });

  it('reads the period from the address, so a shared link lands on the same numbers', async () => {
    const { api } = renderReports(manager, '/reports?from=2026-01-01&to=2026-01-31');
    await screen.findByTestId('indicators-tab');

    expect(lastCountsQuery(api)?.get('from')).toBe('2026-01-01T00:00:00.000Z');
    // The chosen end day enters the window whole, so the exclusive bound is the next day.
    expect(lastCountsQuery(api)?.get('to')).toBe('2026-02-01T00:00:00.000Z');
  });

  it('writes the chosen period in the address and reloads the numbers (AC6.1.2)', async () => {
    const { api } = renderReports(manager, '/reports?from=2026-01-01&to=2026-01-31');
    await screen.findByTestId('indicators-tab');
    const before = api.callsTo('GET', '/reports/ticket-counts').length;

    // A date input takes a whole value at once; typing it character by character would
    // walk through intermediate days that are not the one under test.
    fireEvent.change(screen.getByTestId('period-selector-from'), {
      target: { value: '2026-01-10' },
    });

    await waitFor(() => expect(lastCountsQuery(api)?.get('from')).toBe('2026-01-10T00:00:00.000Z'));
    expect(screen.getByTestId('search-probe')).toHaveTextContent('from=2026-01-10');
    expect(api.callsTo('GET', '/reports/ticket-counts').length).toBeGreaterThan(before);
  });

  it('refuses an inverted period next to the selector, without asking the API (BR2.1)', async () => {
    const { api } = renderReports(manager, '/reports?from=2026-01-31&to=2026-01-31');
    await screen.findByTestId('indicators-tab');
    const before = api.callsTo('GET', '/reports/ticket-counts').length;

    fireEvent.change(screen.getByTestId('period-selector-to'), {
      target: { value: '2026-01-01' },
    });

    expect(
      await screen.findByText('A data de início deve ser anterior ou igual à data de fim.'),
    ).toBeInTheDocument();
    expect(api.callsTo('GET', '/reports/ticket-counts')).toHaveLength(before);
  });

  it('moves to the Consulta tab and keeps the period chosen (BR7.2, BR7.5)', async () => {
    const { api, user } = renderReports(manager, '/reports?from=2026-01-01&to=2026-01-31');
    await screen.findByTestId('indicators-tab');

    await user.click(screen.getByRole('tab', { name: 'Consulta' }));

    expect(await screen.findByTestId('query-tab')).toBeInTheDocument();
    await waitFor(() => expect(api.callsTo('GET', '/reports/tickets')).not.toHaveLength(0));
    expect(api.callsTo('GET', '/reports/tickets').at(-1)?.query.get('from')).toBe(
      '2026-01-01T00:00:00.000Z',
    );
    expect(screen.getByTestId('search-probe')).toHaveTextContent('tab=query');
  });
});
