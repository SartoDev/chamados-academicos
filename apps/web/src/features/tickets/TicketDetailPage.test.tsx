import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CurrentUser, TicketDetail } from '@/app/api/types';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { makeCurrentUser, page } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import {
  agentRef,
  makeClosedTicket,
  makeHistoryEntry,
  makePassage,
  makeTicketDetail,
  makeTicketInAnalysis,
  studentRef,
  ticketOptionRoutes,
} from '@/test/ticket-fixtures';

const student = makeCurrentUser('STUDENT', { id: studentRef.id, name: studentRef.name });
const agent = makeCurrentUser('AGENT', { id: agentRef.id, name: agentRef.name });
const admin = makeCurrentUser('ADMIN');

function renderDetail(
  user: CurrentUser,
  ticket: TicketDetail,
  routes: Record<string, MockHandler> = {},
) {
  const api = mockApi({
    'GET /auth/me': { body: user },
    ...ticketOptionRoutes,
    [`GET /tickets/${ticket.id}`]: { body: ticket },
    [`GET /tickets/${ticket.id}/history`]: { body: page([]) },
    [`GET /tickets/${ticket.id}/sector-passages`]: { body: page([]) },
    ...routes,
  });
  return { api, ...renderApp(`/tickets/${ticket.id}`) };
}

describe('TicketDetailPage (Tela 5, US1.3, BR9.4)', () => {
  it('shows number, title, situation and metadata, with the description in the tab', async () => {
    const ticket = makeTicketInAnalysis();
    renderDetail(student, ticket);

    expect(
      await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' }),
    ).toBeInTheDocument();
    const header = screen.getByTestId('ticket-header');
    expect(within(header).getByTestId('ticket-status-badge')).toHaveTextContent('Em análise');
    expect(within(header).getByTestId('ticket-priority-badge')).toHaveTextContent(
      'Prioridade Normal',
    );
    expect(within(header).getByText('Secretaria')).toBeInTheDocument();
    expect(within(header).getByTestId('assignee-cell')).toHaveTextContent(agentRef.name);
    expect(screen.getByTestId('ticket-details-tab')).toHaveTextContent(
      'Gostaria de solicitar a revisão da nota da P2.',
    );
  });

  it('writes the mark of an unavailable assignee in text (BR3.9)', async () => {
    renderDetail(agent, makeTicketInAnalysis({ assigneeUnavailable: true }));

    expect(await screen.findByTestId('assignee-cell')).toHaveTextContent(
      'Responsável indisponível',
    );
  });

  it('answers a ticket of somebody else without revealing whether it exists (AC5.2.1)', async () => {
    const ticket = makeTicketDetail();
    renderDetail(student, ticket, {
      [`GET /tickets/${ticket.id}`]: { status: 404, body: errorBody('TICKET_NOT_FOUND') },
    });

    expect(
      await screen.findByRole('heading', { name: 'Chamado não encontrado' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/não existe ou não está disponível/)).toBeInTheDocument();
  });

  it('shows the history and the passages in the second tab (AC1.3.6, AC2.4.4)', async () => {
    const ticket = makeTicketDetail();
    const { user } = renderDetail(student, ticket, {
      [`GET /tickets/${ticket.id}/history`]: {
        body: page([
          makeHistoryEntry(),
          makeHistoryEntry({
            id: 'history-2',
            field: 'SECTOR',
            previousValue: 'Secretaria',
            newValue: 'Financeiro',
            justification: 'Assunto do Financeiro.',
          }),
        ]),
      },
      [`GET /tickets/${ticket.id}/sector-passages`]: {
        body: page([
          makePassage({
            leftAt: '2026-09-10T13:00:00.000Z',
            justification: 'Assunto do Financeiro.',
            transferredBy: agentRef,
          }),
        ]),
      },
    });
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });

    await user.click(screen.getByRole('tab', { name: 'Histórico' }));

    const history = await screen.findByTestId('ticket-history-list');
    expect(within(history).getByText(/Aberto para Em análise/)).toBeInTheDocument();
    expect(within(history).getByText(/Secretaria para Financeiro/)).toBeInTheDocument();
    expect(within(history).getByText(/Assunto do Financeiro\./)).toBeInTheDocument();
    expect(screen.getByTestId('ticket-passages-list')).toHaveTextContent('Secretaria');
  });

  it('offers the requester only the closing, and confirms it first (BR9.4, AC1.6.7)', async () => {
    const ticket = makeTicketDetail();
    const { api, user } = renderDetail(student, ticket, {
      [`POST /tickets/${ticket.id}/close`]: {
        body: { ...ticket, status: { id: 'status-closed', key: 'CLOSED', label: 'Encerrado' } },
      },
    });
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });

    expect(screen.queryByTestId('ticket-actions-assume-button')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('ticket-actions-close-button'));
    const dialog = await screen.findByRole('alertdialog', { name: 'Encerrar este chamado?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(api.callsTo('POST', `/tickets/${ticket.id}/close`)).toHaveLength(0);

    await user.click(screen.getByTestId('ticket-actions-close-button'));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Encerrar' }),
    );

    await waitFor(() => expect(api.callsTo('POST', `/tickets/${ticket.id}/close`)).toHaveLength(1));
  });

  it('offers the reopening of a closed ticket inside the window (AC1.6.1)', async () => {
    const ticket = makeClosedTicket();
    const { api, user } = renderDetail(student, ticket, {
      [`POST /tickets/${ticket.id}/reopen`]: { body: makeTicketDetail() },
    });
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });

    await user.click(screen.getByTestId('ticket-actions-reopen-button'));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Reabrir' }),
    );

    await waitFor(() =>
      expect(api.callsTo('POST', `/tickets/${ticket.id}/reopen`)).toHaveLength(1),
    );
  });

  it('lets the agent of the sector take the ticket, and names the assignee on a conflict', async () => {
    const ticket = makeTicketDetail();
    const { api, user } = renderDetail(agent, ticket, {
      [`POST /tickets/${ticket.id}/assume`]: {
        status: 409,
        body: errorBody('TICKET_ALREADY_ASSIGNED', {
          assignee: { id: 'x', name: 'Atendente Elias' },
        }),
      },
    });
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });

    await user.click(screen.getByTestId('ticket-actions-assume-button'));

    expect(await screen.findByTestId('ticket-actions-error')).toHaveTextContent(
      'Este chamado já foi assumido por Atendente Elias.',
    );
    expect(api.callsTo('POST', `/tickets/${ticket.id}/assume`)).toHaveLength(1);
  });

  it('leaves the administrator with the reading only (BR2.3, Q4)', async () => {
    renderDetail(admin, makeTicketInAnalysis());

    expect(await screen.findByTestId('ticket-actions-empty')).toHaveTextContent(
      'apenas para leitura',
    );
    expect(screen.queryByTestId('ticket-actions-assume-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ticket-actions-close-button')).not.toBeInTheDocument();
  });
});
