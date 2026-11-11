import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { financeiroInactive, page, secretaria } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { SectorsTab } from './SectorsTab';

function renderTab(routes: Record<string, MockHandler> = {}) {
  const api = mockApi({
    'GET /sectors': { body: page([secretaria, financeiroInactive]) },
    ...routes,
  });
  return { api, ...renderWithProviders(<SectorsTab />) };
}

const row = (name: string) => screen.getByRole('cell', { name }).closest('tr') as HTMLElement;

describe('SectorsTab and SectorFormDialog (US4.2)', () => {
  it('lists sectors with their situation as text', async () => {
    renderTab();
    await screen.findByRole('cell', { name: 'Secretaria' });

    expect(within(row('Secretaria')).getByText('Ativo')).toBeInTheDocument();
    expect(within(row('Financeiro')).getByText('Inativo')).toBeInTheDocument();
  });

  it('creates a sector and refreshes the list (AC4.2.1)', async () => {
    const { api, user } = renderTab({ 'POST /sectors': { status: 201, body: secretaria } });
    await screen.findByRole('cell', { name: 'Secretaria' });

    await user.click(screen.getByRole('button', { name: 'Novo setor' }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo setor' });
    await user.type(within(dialog).getByLabelText('Nome'), ' Protocolo ');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.callsTo('POST', '/sectors')[0]?.body).toEqual({ name: 'Protocolo' });
    expect(api.callsTo('GET', '/sectors').length).toBeGreaterThan(1);
  });

  it('validates the name when leaving the field', async () => {
    const { user } = renderTab();
    await screen.findByRole('cell', { name: 'Secretaria' });

    await user.click(screen.getByRole('button', { name: 'Novo setor' }));
    await user.click(await screen.findByLabelText('Nome'));
    await user.tab();

    expect(await screen.findByText('Informe o nome.')).toBeInTheDocument();
  });

  it('keeps the dialog open with the message when the name is taken (BR4.1)', async () => {
    const { user } = renderTab({
      'POST /sectors': { status: 409, body: errorBody('CATALOG_NAME_TAKEN') },
    });
    await screen.findByRole('cell', { name: 'Secretaria' });

    await user.click(screen.getByRole('button', { name: 'Novo setor' }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo setor' });
    await user.type(within(dialog).getByLabelText('Nome'), 'SECRETARIA');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Já existe um item com este nome.',
    );
    expect(within(dialog).getByLabelText('Nome')).toHaveValue('SECRETARIA');
  });

  it('edits the name of a sector', async () => {
    const { api, user } = renderTab({ 'PATCH /sectors/sector-secretaria': { body: secretaria } });
    await screen.findByRole('cell', { name: 'Secretaria' });

    await user.click(screen.getByRole('button', { name: 'Editar Secretaria' }));
    const input = within(
      await screen.findByRole('dialog', { name: 'Editar setor' }),
    ).getByLabelText('Nome');
    await user.clear(input);
    await user.type(input, 'Secretaria Geral');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(api.callsTo('PATCH', '/sectors/sector-secretaria')[0]?.body).toEqual({
        name: 'Secretaria Geral',
      }),
    );
  });

  it('explains the effect on categories before deactivating, and reactivates directly', async () => {
    const { api, user } = renderTab({
      'PATCH /sectors/sector-secretaria': { body: { ...secretaria, active: false } },
      'PATCH /sectors/sector-financeiro': { body: { ...financeiroInactive, active: true } },
    });
    await screen.findByRole('cell', { name: 'Secretaria' });

    await user.click(screen.getByRole('button', { name: 'Desativar Secretaria' }));
    const confirm = await screen.findByRole('alertdialog', {
      name: 'Desativar o setor Secretaria?',
    });
    expect(confirm).toHaveTextContent('As categorias do setor deixam de ser oferecidas');
    await user.click(within(confirm).getByRole('button', { name: 'Desativar' }));
    await waitFor(() =>
      expect(api.callsTo('PATCH', '/sectors/sector-secretaria')[0]?.body).toEqual({
        active: false,
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Reativar Financeiro' }));
    await waitFor(() =>
      expect(api.callsTo('PATCH', '/sectors/sector-financeiro')[0]?.body).toEqual({ active: true }),
    );
  });

  it('explains an empty catalog', async () => {
    renderTab({ 'GET /sectors': { body: page([]) } });

    expect(await screen.findByText(/Nenhum setor cadastrado/)).toBeInTheDocument();
  });
});
