import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { makeCurrentUser, page } from '@/test/fixtures';
import { renderWithProviders, type TestRoute } from '@/test/render';
import { makeReportTicket, reportRoutes } from '@/test/report-fixtures';
import { QueryTab } from './QueryTab';
import type { ReportPeriod } from './reports-api';

const PERIOD: ReportPeriod = { from: '2026-09-01T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' };

function renderQueryTab(
  route: TestRoute = '/reports?tab=query',
  routes: Record<string, MockHandler> = {},
) {
  const api = mockApi({
    'GET /auth/me': { body: makeCurrentUser('MANAGER') },
    ...reportRoutes,
    ...routes,
  });
  return { api, ...renderWithProviders(<QueryTab period={PERIOD} />, { route }) };
}

const lastQuery = (api: ReturnType<typeof renderQueryTab>['api']) =>
  api.callsTo('GET', '/reports/tickets').at(-1)?.query;

describe('QueryTab (Tela 9, US6.2, BR5.1, BR5.2)', () => {
  it('lists the tickets of the period with the resolved names and the opening instant', async () => {
    const { api } = renderQueryTab();

    expect(await screen.findByRole('cell', { name: '#42' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Documentos' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Aberto' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Aberto em' })).toBeInTheDocument();
    expect(lastQuery(api)?.get('from')).toBe(PERIOD.from);
  });

  it('sends the three filters combined, with the period (AC6.2.1)', async () => {
    const { api, user } = renderQueryTab();
    await screen.findByTestId('report-tickets-table');

    await user.selectOptions(screen.getByTestId('report-status-filter'), 'status-closed');
    await user.selectOptions(screen.getByTestId('report-category-filter'), 'category-documentos');
    await user.selectOptions(screen.getByTestId('report-sector-filter'), 'sector-secretaria');

    await waitFor(() => expect(lastQuery(api)?.get('sectorId')).toBe('sector-secretaria'));
    expect(lastQuery(api)?.get('statusId')).toBe('status-closed');
    expect(lastQuery(api)?.get('categoryId')).toBe('category-documentos');
    expect(lastQuery(api)?.get('from')).toBe(PERIOD.from);
    expect(lastQuery(api)?.get('to')).toBe(PERIOD.to);
  });

  it('keeps the filters when the page changes (BR5.1)', async () => {
    const { api, user } = renderQueryTab('/reports?tab=query&statusId=status-closed', {
      'GET /reports/tickets': {
        body: page([makeReportTicket()], { total: 45, page: 1, pageSize: 20 }),
      },
    });
    await screen.findByTestId('report-tickets-table');

    await user.click(screen.getByTestId('report-tickets-next-page-button'));

    await waitFor(() => expect(lastQuery(api)?.get('page')).toBe('2'));
    expect(lastQuery(api)?.get('statusId')).toBe('status-closed');
  });

  it('goes back to the first page when a filter changes (AC1.3.2)', async () => {
    const { api, user } = renderQueryTab('/reports?tab=query&page=3', {
      'GET /reports/tickets': {
        body: page([makeReportTicket()], { total: 45, page: 3, pageSize: 20 }),
      },
    });
    await screen.findByTestId('report-tickets-table');

    await user.selectOptions(screen.getByTestId('report-status-filter'), 'status-open');

    await waitFor(() => expect(lastQuery(api)?.get('statusId')).toBe('status-open'));
    expect(lastQuery(api)?.get('page')).toBe('1');
  });

  it('clears its own filters without touching the period above it', async () => {
    const { api, user } = renderQueryTab('/reports?tab=query&statusId=status-closed');
    await screen.findByTestId('report-tickets-table');

    await user.click(screen.getByTestId('report-clear-filters-button'));

    await waitFor(() => expect(lastQuery(api)?.get('statusId')).toBeNull());
    expect(lastQuery(api)?.get('from')).toBe(PERIOD.from);
  });

  it('offers no export action in any state of the screen (BR5.2, AC6.2.2)', async () => {
    renderQueryTab();
    await screen.findByTestId('report-tickets-table');

    expect(screen.queryByRole('button', { name: /exportar|baixar|download|csv|pdf/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /exportar|baixar|download|csv|pdf/i })).toBeNull();
    expect(screen.getByTestId('query-tab').textContent).not.toMatch(/exportar|csv|pdf/i);
  });

  it('shows the empty state when the combination answers nothing', async () => {
    renderQueryTab('/reports?tab=query', {
      'GET /reports/tickets': { body: page([]) },
    });

    expect(await screen.findByTestId('list-state-empty')).toHaveTextContent(
      'Nenhum chamado para os filtros e o período selecionados.',
    );
  });

  it('shows the error state with a retry', async () => {
    const { api, user } = renderQueryTab('/reports?tab=query', {
      'GET /reports/tickets': { status: 500, body: errorBody('INTERNAL_ERROR') },
    });
    const retry = await screen.findByTestId('list-state-retry-button');
    const before = api.callsTo('GET', '/reports/tickets').length;

    await user.click(retry);

    await waitFor(() =>
      expect(api.callsTo('GET', '/reports/tickets').length).toBeGreaterThan(before),
    );
  });
});
