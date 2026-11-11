import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { makeCurrentUser, page } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { agentRef, makeTicket, otherAgentRef, ticketOptionRoutes } from '@/test/ticket-fixtures';

const agent = makeCurrentUser('AGENT', { id: agentRef.id, name: agentRef.name });

function renderQueue(routes: Record<string, MockHandler> = {}, route = '/queue') {
  const api = mockApi({
    'GET /auth/me': { body: agent },
    ...ticketOptionRoutes,
    'GET /tickets': { body: page([makeTicket()]) },
    ...routes,
  });
  return { api, ...renderApp(route) };
}

const lastQueueQuery = (api: ReturnType<typeof renderQueue>['api']) =>
  api.callsTo('GET', '/tickets').at(-1)?.query;

describe('SectorQueuePage (Tela 6, US2.1, BR9.5)', () => {
  it('opens on the unassigned slice of the sector of the actor (AC2.1.1)', async () => {
    const { api } = renderQueue();

    expect(
      await screen.findByRole('heading', { name: 'Fila do Setor — Secretaria' }),
    ).toBeInTheDocument();
    expect(lastQueueQuery(api)?.get('view')).toBe('queue');
    expect(lastQueueQuery(api)?.get('queue')).toBe('unassigned');
    expect(screen.getByRole('tab', { name: 'Não atribuídos' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('offers the four slices and asks the API for the chosen one (BR2.6)', async () => {
    const { api, user } = renderQueue();
    await screen.findByRole('cell', { name: '#42' });

    for (const label of ['Meus', 'Todos', 'Passaram pelo setor']) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
    }
    await user.click(screen.getByRole('tab', { name: 'Passaram pelo setor' }));

    await waitFor(() => expect(lastQueueQuery(api)?.get('queue')).toBe('passed'));
  });

  it('writes the mark of an unavailable assignee in text (BR3.9, AC5.3.4)', async () => {
    renderQueue({
      'GET /tickets': {
        body: page([makeTicket({ assignee: otherAgentRef, assigneeUnavailable: true })]),
      },
    });

    const row = await screen.findByTestId('queue-table-row-ticket-42');
    expect(within(row).getByTestId('assignee-cell')).toHaveTextContent('Responsável indisponível');
  });

  it('takes a ticket from the row with the keyboard (BR9.5)', async () => {
    const { api, user } = renderQueue({
      'POST /tickets/ticket-42/assume': { body: makeTicket({ assignee: agentRef }) },
    });
    const button = await screen.findByTestId('queue-table-assume-button-ticket-42');

    button.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => expect(api.callsTo('POST', '/tickets/ticket-42/assume')).toHaveLength(1));
  });

  it('shows the current assignee on the row when the ticket was already taken (AC2.2.2)', async () => {
    const { user } = renderQueue({
      'POST /tickets/ticket-42/assume': {
        status: 409,
        body: errorBody('TICKET_ALREADY_ASSIGNED', {
          assignee: { id: otherAgentRef.id, name: otherAgentRef.name },
        }),
      },
    });
    await screen.findByTestId('queue-table-assume-button-ticket-42');

    await user.click(screen.getByTestId('queue-table-assume-button-ticket-42'));

    expect(await screen.findByTestId('queue-table-row-error-ticket-42')).toHaveTextContent(
      `Este chamado já foi assumido por ${otherAgentRef.name}.`,
    );
  });

  it('explains that the actor has no sector instead of showing an empty queue (AC2.1.4)', async () => {
    renderQueue({
      'GET /tickets': { status: 403, body: errorBody('TICKET_QUEUE_NO_SECTOR') },
    });

    expect(await screen.findByTestId('queue-no-sector')).toHaveTextContent(
      'Seu usuário não está vinculado a um setor.',
    );
    expect(screen.queryByTestId('queue-table')).not.toBeInTheDocument();
  });

  it('keeps the slice and the filters when the page changes (AC2.1.5)', async () => {
    const { api, user } = renderQueue(
      { 'GET /tickets': { body: page([makeTicket()], { total: 25 }) } },
      '/queue?queue=all&statusId=status-open',
    );
    await screen.findByRole('cell', { name: '#42' });

    await user.click(screen.getByRole('button', { name: 'Próxima' }));

    await waitFor(() => expect(lastQueueQuery(api)?.get('page')).toBe('2'));
    expect(lastQueueQuery(api)?.get('queue')).toBe('all');
    expect(lastQueueQuery(api)?.get('statusId')).toBe('status-open');
  });

  it('explains an empty slice with the message of that slice', async () => {
    renderQueue({ 'GET /tickets': { body: page([]) } });

    expect(await screen.findByTestId('list-state-empty')).toHaveTextContent(
      'Todos os chamados já têm responsável.',
    );
  });

  it('shows the error of the queue with a retry that keeps the slice (AC2.1.6)', async () => {
    const { api, user } = renderQueue(
      { 'GET /tickets': { status: 500, body: errorBody('INTERNAL_ERROR') } },
      '/queue?queue=all',
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar a fila do setor.',
    );

    api.routes['GET /tickets'] = { body: page([makeTicket()]) };
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('cell', { name: '#42' })).toBeInTheDocument();
    expect(lastQueueQuery(api)?.get('queue')).toBe('all');
  });
});
