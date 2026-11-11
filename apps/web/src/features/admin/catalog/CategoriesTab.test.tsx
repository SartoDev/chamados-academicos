import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Category } from '@/app/api/types';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { documentos, financeiroInactive, page, secretaria } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { CategoriesTab } from './CategoriesTab';

const boletos: Category = {
  ...documentos,
  id: 'category-boletos',
  name: 'Boletos',
  sector: { id: financeiroInactive.id, name: financeiroInactive.name },
  active: false,
};

function renderTab(routes: Record<string, MockHandler> = {}) {
  const api = mockApi({
    'GET /categories': { body: page([documentos, boletos]) },
    'GET /sectors': { body: page([secretaria]) },
    ...routes,
  });
  return { api, ...renderWithProviders(<CategoriesTab />) };
}

const row = (name: string) => screen.getByRole('cell', { name }).closest('tr') as HTMLElement;

describe('CategoriesTab and CategoryFormDialog (US4.2, BR4.2)', () => {
  it('lists categories with their destination sector and situation', async () => {
    renderTab();
    await screen.findByRole('cell', { name: 'Documentos' });

    expect(within(row('Documentos')).getByText('Secretaria')).toBeInTheDocument();
    expect(within(row('Boletos')).getByText('Inativo')).toBeInTheDocument();
  });

  it('creates a category choosing among the active sectors', async () => {
    const { api, user } = renderTab({ 'POST /categories': { status: 201, body: documentos } });
    await screen.findByRole('cell', { name: 'Documentos' });

    await user.click(screen.getByRole('button', { name: 'Nova categoria' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nova categoria' });
    await user.type(within(dialog).getByLabelText('Nome'), 'Matrícula');
    await user.selectOptions(
      within(dialog).getByLabelText('Setor'),
      await within(dialog).findByRole('option', { name: 'Secretaria' }),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(api.callsTo('POST', '/categories')[0]?.body).toEqual({
        name: 'Matrícula',
        sectorId: secretaria.id,
      }),
    );
  });

  it('requires the sector (AC4.2.2)', async () => {
    const { api, user } = renderTab();
    await screen.findByRole('cell', { name: 'Documentos' });

    await user.click(screen.getByRole('button', { name: 'Nova categoria' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nova categoria' });
    await user.type(within(dialog).getByLabelText('Nome'), 'Sem setor');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await within(dialog).findByText('Escolha o setor responsável.')).toBeInTheDocument();
    expect(api.callsTo('POST', '/categories')).toHaveLength(0);
  });

  it('keeps an inactive current sector visible when editing and shows a server refusal', async () => {
    const { user } = renderTab({
      'PATCH /categories/category-boletos': {
        status: 422,
        body: errorBody('CATALOG_ITEM_INACTIVE'),
      },
    });
    await screen.findByRole('cell', { name: 'Boletos' });

    await user.click(screen.getByRole('button', { name: 'Editar Boletos' }));
    const dialog = await screen.findByRole('dialog', { name: 'Editar categoria' });
    expect(within(dialog).getByLabelText('Setor')).toHaveDisplayValue('Financeiro (inativo)');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'O item escolhido está inativo',
    );
  });

  it('deactivates after confirmation and closes the dialog on cancel', async () => {
    const { api, user } = renderTab({
      'PATCH /categories/category-documentos': { body: { ...documentos, active: false } },
    });
    await screen.findByRole('cell', { name: 'Documentos' });

    await user.click(screen.getByRole('button', { name: 'Nova categoria' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }),
    );
    await user.click(screen.getByRole('button', { name: 'Desativar Documentos' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Desativar' }),
    );

    await waitFor(() =>
      expect(api.callsTo('PATCH', '/categories/category-documentos')[0]?.body).toEqual({
        active: false,
      }),
    );
  });

  it('shows a load error with retry', async () => {
    renderTab({ 'GET /categories': { status: 503, body: errorBody('INTERNAL_ERROR') } });

    expect(await screen.findByTestId('list-state-error')).toHaveTextContent(
      'Não foi possível carregar as categorias.',
    );
  });
});
