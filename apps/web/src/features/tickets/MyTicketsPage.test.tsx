import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { documentos, page } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { makeTicket, ticketOptionRoutes } from '@/test/ticket-fixtures';
import { MyTicketsPage } from './MyTicketsPage';

function renderPage(routes: Record<string, MockHandler> = {}, route = '/tickets') {
  const api = mockApi({
    'GET /tickets': { body: page([makeTicket()]) },
    ...ticketOptionRoutes,
    ...routes,
  });
  return { api, ...renderWithProviders(<MyTicketsPage />, { route }) };
}

const lastTicketQuery = (api: ReturnType<typeof renderPage>['api']) =>
  api.callsTo('GET', '/tickets').at(-1)?.query;

describe('MyTicketsPage (Tela 3, US1.3)', () => {
  it('asks for the tickets of the requester and lists them with number and status', async () => {
    const { api } = renderPage();

    expect(await screen.findByRole('cell', { name: '#42' })).toBeInTheDocument();
    const table = screen.getByTestId('my-tickets-table');
    expect(within(table).getByRole('link', { name: 'Revisão de nota' })).toHaveAttribute(
      'href',
      '/tickets/ticket-42',
    );
    expect(within(table).getByTestId('ticket-status-badge')).toHaveTextContent('Aberto');
    expect(lastTicketQuery(api)?.get('view')).toBe('requested');
  });

  it('shows the same tickets as cards for narrow screens (AC5.4.2)', async () => {
    renderPage();
    await screen.findByRole('cell', { name: '#42' });

    const cards = screen.getByTestId('my-tickets-cards');
    expect(within(cards).getByTestId('my-tickets-card-ticket-42')).toHaveTextContent('#42');
    expect(within(cards).getByRole('link', { name: 'Revisão de nota' })).toBeInTheDocument();
  });

  it('invites the requester to open the first ticket when there is none (AC1.3.3)', async () => {
    renderPage({ 'GET /tickets': { body: page([]) } });

    expect(await screen.findByText('Você ainda não abriu nenhum chamado.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir meu primeiro chamado' })).toHaveAttribute(
      'href',
      '/tickets/new',
    );
  });

  it('offers to clear the filters when nothing matches them', async () => {
    const { api, user } = renderPage(
      { 'GET /tickets': { body: page([]) } },
      '/tickets?statusId=status-open',
    );
    await screen.findByText('Nenhum chamado corresponde aos filtros.');

    await user.click(screen.getByTestId('my-tickets-empty-clear-button'));

    await waitFor(() => expect(lastTicketQuery(api)?.get('statusId')).toBeNull());
  });

  it('sends the chosen filter to the API and goes back to the first page (AC1.3.2)', async () => {
    const { api, user } = renderPage({}, '/tickets?page=2');
    await screen.findByRole('cell', { name: '#42' });

    await user.selectOptions(screen.getByLabelText('Categoria'), documentos.id);

    await waitFor(() => expect(lastTicketQuery(api)?.get('categoryId')).toBe(documentos.id));
    expect(lastTicketQuery(api)?.get('page')).toBe('1');
  });

  it('keeps the filters when the page changes (AC1.3.7)', async () => {
    const { api, user } = renderPage(
      { 'GET /tickets': { body: page([makeTicket()], { total: 25 }) } },
      '/tickets?statusId=status-open',
    );
    await screen.findByRole('cell', { name: '#42' });

    await user.click(screen.getByRole('button', { name: 'Próxima' }));

    await waitFor(() => expect(lastTicketQuery(api)?.get('page')).toBe('2'));
    expect(lastTicketQuery(api)?.get('statusId')).toBe('status-open');
    expect(screen.getByText('Mostrando 1–20 de 25')).toBeInTheDocument();
  });

  it('shows the error with a retry action (AC1.3.8)', async () => {
    const { api, user } = renderPage({
      'GET /tickets': { status: 500, body: errorBody('INTERNAL_ERROR') },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar seus chamados.',
    );

    api.routes['GET /tickets'] = { body: page([makeTicket()]) };
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('cell', { name: '#42' })).toBeInTheDocument();
  });
});
