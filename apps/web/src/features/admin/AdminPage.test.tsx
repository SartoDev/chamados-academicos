import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/api-mock';
import {
  administrator,
  documentos,
  makeUser,
  page,
  priorities,
  secretaria,
  statuses,
} from '@/test/fixtures';
import { renderApp } from '@/test/render';

function renderAdmin() {
  mockApi({
    'GET /auth/me': { body: administrator },
    'GET /users': { body: page([makeUser('STUDENT', { name: 'Ana' })]) },
    'GET /sectors': { body: page([secretaria]) },
    'GET /categories': { body: page([documentos]) },
    'GET /statuses': { body: page(statuses) },
    'GET /priorities': { body: page(priorities) },
  });
  return renderApp('/admin');
}

describe('AdminPage (Tela 8, US4.1, US4.2)', () => {
  it('offers the five administration tabs', async () => {
    renderAdmin();

    const tablist = await screen.findByRole('tablist', { name: 'Seções da administração' });
    expect(
      within(tablist)
        .getAllByRole('tab')
        .map((tab) => tab.textContent),
    ).toEqual(['Usuários', 'Setores', 'Categorias', 'Status', 'Prioridades']);
  });

  it('opens on the users tab', async () => {
    renderAdmin();

    expect(await screen.findByRole('tab', { name: 'Usuários' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await screen.findByRole('cell', { name: 'Ana' })).toBeInTheDocument();
  });

  it('moves between tabs with the arrow keys (AC5.3.1)', async () => {
    const { user } = renderAdmin();
    await user.click(await screen.findByRole('tab', { name: 'Usuários' }));

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Setores' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('heading', { level: 2, name: 'Setores' })).toBeInTheDocument();

    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Status' })).toHaveFocus();
    expect(await screen.findByRole('cell', { name: 'Aguardando solicitante' })).toBeInTheDocument();
  });

  it('loads categories and priorities when their tabs are opened', async () => {
    const { user } = renderAdmin();

    await user.click(await screen.findByRole('tab', { name: 'Categorias' }));
    expect(await screen.findByRole('cell', { name: 'Documentos' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Prioridades' }));
    expect(await screen.findByRole('cell', { name: 'Normal' })).toBeInTheDocument();
  });
});
