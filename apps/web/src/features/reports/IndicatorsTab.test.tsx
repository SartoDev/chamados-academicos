import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { makeCurrentUser } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { makeCounts, makeDurations, reportRoutes } from '@/test/report-fixtures';
import { IndicatorsTab } from './IndicatorsTab';
import type { ReportPeriod } from './reports-api';

const PERIOD: ReportPeriod = { from: '2026-09-01T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' };

function renderTab(
  role: 'MANAGER' | 'ADMIN' = 'MANAGER',
  routes: Record<string, MockHandler> = {},
) {
  const api = mockApi({
    'GET /auth/me': { body: makeCurrentUser(role) },
    ...reportRoutes,
    ...routes,
  });
  return { api, ...renderWithProviders(<IndicatorsTab period={PERIOD} role={role} />) };
}

describe('IndicatorsTab (Tela 9, BR7.1, BR7.3)', () => {
  it('shows one card per status, with zero on the ones without tickets (BR7.1)', async () => {
    renderTab();

    expect(await screen.findByTestId('indicators-count-status-open-value')).toHaveTextContent('3');
    expect(screen.getByTestId('indicators-count-status-closed-value')).toHaveTextContent('2');
    // The count answered no group for these two; the catalog of U1 gives name and zero.
    expect(screen.getByTestId('indicators-count-status-analysis-value')).toHaveTextContent('0');
    expect(screen.getByTestId('indicators-count-status-waiting-value')).toHaveTextContent('0');
    expect(screen.getByText('Aguardando solicitante')).toBeInTheDocument();
  });

  it('shows the two duration cards, each with its own sample (BR4.3)', async () => {
    renderTab();

    const resolution = await screen.findByTestId('indicators-resolution-card');
    const handling = screen.getByTestId('indicators-handling-card');
    expect(within(resolution).getByTestId('indicators-resolution-card-value')).toHaveTextContent(
      '1 d 2 h',
    );
    expect(within(resolution).getByTestId('indicators-resolution-card-sample')).toHaveTextContent(
      'Base: 4 chamados',
    );
    expect(within(handling).getByTestId('indicators-handling-card-value')).toHaveTextContent(
      '1 h 30 min',
    );
    expect(within(handling).getByTestId('indicators-handling-card-sample')).toHaveTextContent(
      'Base: 2 chamados',
    );
  });

  it('mounts the chart by sector only for the administrator (Q4)', async () => {
    const { unmount } = renderTab('MANAGER');
    await screen.findByTestId('indicators-category-chart');
    expect(screen.queryByTestId('indicators-sector-chart')).not.toBeInTheDocument();
    unmount();

    renderTab('ADMIN');

    expect(await screen.findByTestId('indicators-sector-chart')).toBeInTheDocument();
    expect(screen.getByTestId('indicators-category-chart')).toBeInTheDocument();
  });

  it('says the two numbers answer different windows, next to the cards (CA3)', async () => {
    renderTab();

    expect(await screen.findByTestId('indicators-period-note')).toHaveTextContent(
      'As quantidades contam os chamados abertos no período; os tempos médios e a avaliação média consideram os chamados encerrados no período.',
    );
  });

  it('shows the explanatory empty state instead of zeros when the period has nothing (BR2.2)', async () => {
    renderTab('MANAGER', {
      'GET /reports/ticket-counts': { body: makeCounts([]) },
      'GET /reports/durations': {
        body: makeDurations({
          averageResolutionSeconds: null,
          averageHandlingSeconds: null,
          resolutionSampleSize: 0,
          handlingSampleSize: 0,
        }),
      },
    });

    expect(await screen.findByTestId('list-state-empty')).toHaveTextContent(
      'Nenhum chamado no período selecionado.',
    );
    expect(screen.queryByTestId('indicators-tab')).not.toBeInTheDocument();
  });

  it('shows the error state with a retry that asks the API again (BR7.3)', async () => {
    const { api, user } = renderTab('MANAGER', {
      'GET /reports/durations': { status: 500, body: errorBody('INTERNAL_ERROR') },
    });
    const retry = await screen.findByTestId('list-state-retry-button');
    const before = api.callsTo('GET', '/reports/durations').length;

    await user.click(retry);

    await waitFor(() =>
      expect(api.callsTo('GET', '/reports/durations').length).toBeGreaterThan(before),
    );
    expect(screen.getByTestId('list-state-error')).toHaveTextContent(
      'Não foi possível carregar os indicadores.',
    );
  });

  it('announces the loading state while the numbers are on their way (CT7)', () => {
    renderTab();

    expect(screen.getByTestId('list-state-loading')).toBeInTheDocument();
  });
});
