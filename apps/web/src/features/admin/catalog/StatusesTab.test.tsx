import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { page, statuses } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { StatusesTab } from './StatusesTab';

function renderTab(routes: Record<string, MockHandler> = {}) {
  const api = mockApi({ 'GET /statuses': { body: page(statuses) }, ...routes });
  return { api, ...renderWithProviders(<StatusesTab />) };
}

async function openEditor(user: ReturnType<typeof renderTab>['user']) {
  await user.click(await screen.findByRole('button', { name: 'Editar rótulo de Aberto' }));
  return screen.findByRole('dialog', { name: 'Editar rótulo do status' });
}

describe('StatusesTab and StatusLabelDialog (BR4.6)', () => {
  it('lists the four statuses with label and stable key, without create or deactivate actions', async () => {
    renderTab();

    expect(await screen.findByRole('cell', { name: 'Aguardando solicitante' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(5);
    expect(screen.getByText('WAITING_REQUESTER')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Desativar|Novo/ })).not.toBeInTheDocument();
  });

  it('edits only the label and shows the key as information', async () => {
    const { api, user } = renderTab({ 'PATCH /statuses/status-open': { body: statuses[0] } });

    const dialog = await openEditor(user);
    expect(dialog).toHaveTextContent('Chave do status: OPEN');
    expect(within(dialog).getAllByRole('textbox')).toHaveLength(1);
    const label = within(dialog).getByLabelText('Rótulo');
    await user.clear(label);
    await user.type(label, 'Novo');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(api.callsTo('PATCH', '/statuses/status-open')[0]?.body).toEqual({ label: 'Novo' }),
    );
  });

  it('places a server field error next to the label', async () => {
    const { user } = renderTab({
      'PATCH /statuses/status-open': {
        status: 400,
        body: errorBody('VALIDATION_FAILED', [{ field: 'label', code: 'TOO_LONG' }]),
      },
    });

    const dialog = await openEditor(user);
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await within(dialog).findByText('Texto maior que o permitido.')).toBeInTheDocument();
  });

  it('shows a repeated label above the buttons', async () => {
    const { user } = renderTab({
      'PATCH /statuses/status-open': { status: 409, body: errorBody('CATALOG_NAME_TAKEN') },
    });

    const dialog = await openEditor(user);
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Já existe um item com este nome.',
    );
  });

  it('requires a label', async () => {
    const { user } = renderTab();

    const dialog = await openEditor(user);
    await user.clear(within(dialog).getByLabelText('Rótulo'));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await within(dialog).findByText('Informe o rótulo.')).toBeInTheDocument();
  });

  it('offers a retry after a load error', async () => {
    const { api, user } = renderTab({
      'GET /statuses': { status: 500, body: errorBody('INTERNAL_ERROR') },
    });
    await screen.findByTestId('list-state-error');

    api.routes['GET /statuses'] = { body: page(statuses) };
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('cell', { name: 'Encerrado' })).toBeInTheDocument();
  });
});
