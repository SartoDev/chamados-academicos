import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CurrentUser, TicketDetail } from '@/app/api/types';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { makeCurrentUser, page, priorities } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import {
  agentRef,
  financeiro,
  makeTicketDetail,
  makeTicketInAnalysis,
  managerRef,
  otherAgentRef,
  ticketOptionRoutes,
} from '@/test/ticket-fixtures';

const agent = makeCurrentUser('AGENT', { id: agentRef.id, name: agentRef.name });
const manager = makeCurrentUser('MANAGER', { id: managerRef.id, name: managerRef.name });

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
    [`GET /tickets/${ticket.id}/assignable-users`]: {
      body: { items: [agentRef, otherAgentRef, managerRef] },
    },
    ...routes,
  });
  return { api, ...renderApp(`/tickets/${ticket.id}`) };
}

describe('TransferDialog (BR9.7, US2.4)', () => {
  it('offers only sectors other than the current one (AC2.4.2)', async () => {
    const ticket = makeTicketInAnalysis();
    const { user } = renderDetail(agent, ticket);
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });

    await user.click(screen.getByTestId('ticket-actions-transfer-button'));

    const dialog = await screen.findByRole('dialog', { name: 'Transferir chamado' });
    expect(within(dialog).getByRole('option', { name: financeiro.name })).toBeInTheDocument();
    expect(within(dialog).queryByRole('option', { name: 'Secretaria' })).not.toBeInTheDocument();
  });

  it('requires a justification of at least 5 characters before sending (AC2.4.3)', async () => {
    const ticket = makeTicketInAnalysis();
    const { api, user } = renderDetail(agent, ticket);
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });
    await user.click(screen.getByTestId('ticket-actions-transfer-button'));
    const dialog = await screen.findByRole('dialog', { name: 'Transferir chamado' });

    await user.selectOptions(within(dialog).getByLabelText('Setor de destino'), financeiro.id);
    await user.type(within(dialog).getByLabelText('Justificativa'), 'abc');
    await user.click(within(dialog).getByRole('button', { name: 'Transferir' }));

    expect(
      await screen.findByText('A justificativa deve ter pelo menos 5 caracteres.'),
    ).toBeInTheDocument();
    expect(api.callsTo('POST', `/tickets/${ticket.id}/transfer`)).toHaveLength(0);
  });

  it('transfers with the destination and the justification, and closes the dialog', async () => {
    const ticket = makeTicketInAnalysis();
    const { api, user } = renderDetail(agent, ticket, {
      [`POST /tickets/${ticket.id}/transfer`]: {
        body: makeTicketDetail({ sector: financeiro, assignee: null }),
      },
    });
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });
    await user.click(screen.getByTestId('ticket-actions-transfer-button'));
    const dialog = await screen.findByRole('dialog', { name: 'Transferir chamado' });

    await user.selectOptions(within(dialog).getByLabelText('Setor de destino'), financeiro.id);
    await user.type(
      within(dialog).getByLabelText('Justificativa'),
      'Assunto do Financeiro, fora do alcance da Secretaria.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Transferir' }));

    await waitFor(() =>
      expect(api.callsTo('POST', `/tickets/${ticket.id}/transfer`)[0]?.body).toEqual({
        targetSectorId: financeiro.id,
        justification: 'Assunto do Financeiro, fora do alcance da Secretaria.',
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the dialog open with the translated message when the server refuses', async () => {
    const ticket = makeTicketInAnalysis();
    const { user } = renderDetail(agent, ticket, {
      [`POST /tickets/${ticket.id}/transfer`]: {
        status: 422,
        body: errorBody('TICKET_TRANSFER_SAME_SECTOR'),
      },
    });
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });
    await user.click(screen.getByTestId('ticket-actions-transfer-button'));
    const dialog = await screen.findByRole('dialog', { name: 'Transferir chamado' });

    await user.selectOptions(within(dialog).getByLabelText('Setor de destino'), financeiro.id);
    await user.type(within(dialog).getByLabelText('Justificativa'), 'Justificativa suficiente.');
    await user.click(within(dialog).getByRole('button', { name: 'Transferir' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Escolha um setor diferente do setor atual do chamado.',
    );
    expect(screen.getByRole('dialog', { name: 'Transferir chamado' })).toBeInTheDocument();
  });
});

describe('AssignDialog (BR8.5, US3.1)', () => {
  it('lists who may receive the ticket and marks the current assignee (AC3.1.1)', async () => {
    const ticket = makeTicketInAnalysis();
    const { user } = renderDetail(manager, ticket);
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });

    await user.click(screen.getByTestId('ticket-actions-assign-button'));

    const dialog = await screen.findByRole('dialog', { name: 'Atribuir chamado' });
    expect(await within(dialog).findByText(/Atendente Elias/)).toBeInTheDocument();
    expect(within(dialog).getByText(/\(responsável atual\)/)).toBeInTheDocument();
    expect(within(dialog).getByTestId(`assign-dialog-option-${agentRef.id}`)).toBeChecked();
  });

  it('assigns the chosen person and closes the dialog', async () => {
    const ticket = makeTicketDetail();
    const { api, user } = renderDetail(manager, ticket, {
      [`POST /tickets/${ticket.id}/assign`]: {
        body: makeTicketInAnalysis({ assignee: otherAgentRef }),
      },
    });
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });
    await user.click(screen.getByTestId('ticket-actions-assign-button'));
    const dialog = await screen.findByRole('dialog', { name: 'Atribuir chamado' });

    await user.click(await within(dialog).findByTestId(`assign-dialog-option-${otherAgentRef.id}`));
    await user.click(within(dialog).getByRole('button', { name: 'Atribuir' }));

    await waitFor(() =>
      expect(api.callsTo('POST', `/tickets/${ticket.id}/assign`)[0]?.body).toEqual({
        assigneeId: otherAgentRef.id,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('explains a refusal of the server inside the dialog (AC3.1.2)', async () => {
    const ticket = makeTicketDetail();
    const { user } = renderDetail(manager, ticket, {
      [`POST /tickets/${ticket.id}/assign`]: {
        status: 422,
        body: errorBody('TICKET_ASSIGNEE_NOT_IN_SECTOR'),
      },
    });
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });
    await user.click(screen.getByTestId('ticket-actions-assign-button'));
    const dialog = await screen.findByRole('dialog', { name: 'Atribuir chamado' });

    await user.click(await within(dialog).findByTestId(`assign-dialog-option-${otherAgentRef.id}`));
    await user.click(within(dialog).getByRole('button', { name: 'Atribuir' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'A pessoa escolhida não pode receber chamados deste setor.',
    );
  });
});

describe('PriorityDialog (BR3.7, AC2.3.3)', () => {
  it('starts on the current priority and sends the chosen one', async () => {
    const ticket = makeTicketInAnalysis();
    const { api, user } = renderDetail(agent, ticket, {
      [`PUT /tickets/${ticket.id}/priority`]: {
        body: makeTicketInAnalysis({ priority: { id: priorities[2].id, label: 'Alta' } }),
      },
    });
    await screen.findByRole('heading', { level: 1, name: '#42 Revisão de nota' });

    await user.click(screen.getByTestId('ticket-actions-priority-button'));
    const dialog = await screen.findByRole('dialog', { name: 'Alterar prioridade' });
    expect(
      await within(dialog).findByTestId(`priority-dialog-option-${priorities[1].id}`),
    ).toBeChecked();

    await user.click(within(dialog).getByTestId(`priority-dialog-option-${priorities[2].id}`));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(api.callsTo('PUT', `/tickets/${ticket.id}/priority`)[0]?.body).toEqual({
        priorityId: priorities[2].id,
      }),
    );
  });
});
