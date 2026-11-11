import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Priority } from '@/app/api/types';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { page, priorities } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { PrioritiesTab } from './PrioritiesTab';

const retired: Priority = {
  id: 'priority-retired',
  label: 'Antiga',
  isDefault: false,
  active: false,
};

function renderTab(routes: Record<string, MockHandler> = {}) {
  const api = mockApi({ 'GET /priorities': { body: page([...priorities, retired]) }, ...routes });
  return { api, ...renderWithProviders(<PrioritiesTab />) };
}

const row = (label: string) =>
  screen.getByRole('cell', { name: label }).closest('tr') as HTMLElement;

describe('PrioritiesTab and PriorityFormDialog (BR4.7)', () => {
  it('lists priorities with the default mark and the situation written as text', async () => {
    renderTab();
    await screen.findByRole('cell', { name: 'Normal' });

    expect(within(row('Normal')).getByText('Sim')).toBeInTheDocument();
    expect(within(row('Baixa')).getByText('Não')).toBeInTheDocument();
    expect(within(row('Antiga')).getByText('Inativo')).toBeInTheDocument();
  });

  it('creates a priority marked as default', async () => {
    const { api, user } = renderTab({ 'POST /priorities': { status: 201, body: priorities[1] } });
    await screen.findByRole('cell', { name: 'Normal' });

    await user.click(screen.getByRole('button', { name: 'Nova prioridade' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nova prioridade' });
    await user.type(within(dialog).getByLabelText('Rótulo'), 'Urgente');
    const checkbox = within(dialog).getByRole('checkbox', { name: 'Prioridade padrão' });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(api.callsTo('POST', '/priorities')[0]?.body).toEqual({
        label: 'Urgente',
        isDefault: true,
      }),
    );
  });

  it('creates a regular priority when the mark is left unchecked', async () => {
    const { api, user } = renderTab({ 'POST /priorities': { status: 201, body: priorities[0] } });
    await screen.findByRole('cell', { name: 'Normal' });

    await user.click(screen.getByRole('button', { name: 'Nova prioridade' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nova prioridade' });
    await user.type(within(dialog).getByLabelText('Rótulo'), 'Média');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(api.callsTo('POST', '/priorities')[0]?.body).toEqual({
        label: 'Média',
        isDefault: false,
      }),
    );
  });

  it('keeps the mark when editing the default priority', async () => {
    const { api, user } = renderTab({
      'PATCH /priorities/priority-normal': { body: priorities[1] },
    });
    await screen.findByRole('cell', { name: 'Normal' });

    await user.click(screen.getByRole('button', { name: 'Editar Normal' }));
    const dialog = await screen.findByRole('dialog', { name: 'Editar prioridade' });
    expect(within(dialog).getByRole('checkbox', { name: 'Prioridade padrão' })).toBeChecked();
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(api.callsTo('PATCH', '/priorities/priority-normal')[0]?.body).toEqual({
        label: 'Normal',
        isDefault: true,
      }),
    );
  });

  it('shows the refusal to deactivate the default priority on its row', async () => {
    const { user } = renderTab({
      'PATCH /priorities/priority-normal': {
        status: 422,
        body: errorBody('CATALOG_DEFAULT_PRIORITY_REQUIRED'),
      },
    });
    await screen.findByRole('cell', { name: 'Normal' });

    await user.click(screen.getByRole('button', { name: 'Desativar Normal' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Desativar' }),
    );

    expect(await within(row('Normal')).findByRole('alert')).toHaveTextContent(
      'É preciso manter sempre uma prioridade padrão ativa.',
    );
  });

  it('shows the refusal to mark an inactive priority as default above the buttons', async () => {
    const { user } = renderTab({
      'PATCH /priorities/priority-retired': {
        status: 422,
        body: errorBody('CATALOG_DEFAULT_PRIORITY_REQUIRED'),
      },
    });
    await screen.findByRole('cell', { name: 'Antiga' });

    await user.click(screen.getByRole('button', { name: 'Editar Antiga' }));
    const dialog = await screen.findByRole('dialog', { name: 'Editar prioridade' });
    await user.click(within(dialog).getByRole('checkbox', { name: 'Prioridade padrão' }));
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('prioridade padrão ativa');
  });

  it('reactivates without confirmation', async () => {
    const { api, user } = renderTab({
      'PATCH /priorities/priority-retired': { body: { ...retired, active: true } },
    });
    await screen.findByRole('cell', { name: 'Antiga' });

    await user.click(screen.getByRole('button', { name: 'Reativar Antiga' }));

    await waitFor(() =>
      expect(api.callsTo('PATCH', '/priorities/priority-retired')[0]?.body).toEqual({
        active: true,
      }),
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('explains an empty list', async () => {
    renderTab({ 'GET /priorities': { body: page([]) } });

    expect(await screen.findByText('Nenhuma prioridade cadastrada.')).toBeInTheDocument();
  });
});
