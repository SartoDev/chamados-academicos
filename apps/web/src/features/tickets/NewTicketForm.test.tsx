import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { documentos, page, priorities, student } from '@/test/fixtures';
import { renderApp, renderWithProviders } from '@/test/render';
import { makeTicketDetail, ticketOptionRoutes } from '@/test/ticket-fixtures';
import { NewTicketForm } from './NewTicketForm';

const openedTicket = makeTicketDetail({ id: 'ticket-90', reference: '#90' });

function renderForm(routes: Record<string, MockHandler> = {}) {
  const api = mockApi({
    ...ticketOptionRoutes,
    'POST /tickets': { status: 201, body: openedTicket },
    ...routes,
  });
  return { api, ...renderWithProviders(<NewTicketForm />, { route: '/tickets/new' }) };
}

/** The options arrive with the catalog answer, so the test waits for them before choosing. */
async function chooseCategory(user: ReturnType<typeof renderForm>['user']) {
  await screen.findByRole('option', { name: documentos.name });
  await user.selectOptions(screen.getByLabelText('Categoria'), documentos.id);
}

async function fillForm(user: ReturnType<typeof renderForm>['user']) {
  await chooseCategory(user);
  await user.type(screen.getByLabelText('Título'), '  Revisão de nota  ');
  await user.type(
    screen.getByLabelText('Descrição'),
    '  Gostaria de solicitar a revisão da nota da P2.  ',
  );
}

describe('NewTicketForm (Tela 4, US1.2, BR9.3)', () => {
  it('shows the sector of the chosen category, without letting it be edited (AC1.2.1)', async () => {
    const { user } = renderForm();

    const sector = screen.getByLabelText('Setor responsável');
    expect(sector).toHaveAttribute('readonly');
    expect(sector).toHaveValue('');

    await chooseCategory(user);

    expect(screen.getByLabelText('Setor responsável')).toHaveValue('Secretaria');
  });

  it('starts on the default priority (AC1.2.3)', async () => {
    renderForm();

    const normal = await screen.findByTestId(`new-ticket-form-priority-${priorities[1].id}`);
    expect(normal).toBeChecked();
    expect(screen.getByTestId(`new-ticket-form-priority-${priorities[0].id}`)).not.toBeChecked();
  });

  it('counts the characters and refuses a short title when leaving the field (AC1.2.4, CT8)', async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText('Título'), 'Nota');
    await user.tab();

    expect(
      await screen.findByText('O título deve ter pelo menos 5 caracteres.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveAccessibleDescription(/4\/120 caracteres/);
  });

  it('opens the ticket with the texts trimmed and leads to the detail with the confirmation', async () => {
    mockApi({
      'GET /auth/me': { body: student },
      ...ticketOptionRoutes,
      'GET /tickets': { body: page([]) },
      'POST /tickets': { status: 201, body: openedTicket },
      'GET /tickets/ticket-90': { body: openedTicket },
      'GET /tickets/ticket-90/history': { body: page([]) },
      'GET /tickets/ticket-90/sector-passages': { body: page([]) },
    });
    const { user } = renderApp('/tickets/new');
    await fillForm(user);

    await user.click(screen.getByRole('button', { name: 'Abrir Chamado' }));

    expect(await screen.findByTestId('ticket-detail-notice')).toHaveTextContent(
      'Chamado #90 aberto.',
    );
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/tickets/ticket-90');
  });

  it('sends the values the server expects', async () => {
    const { api, user } = renderForm();
    await fillForm(user);

    await user.click(screen.getByRole('button', { name: 'Abrir Chamado' }));

    await waitFor(() => expect(api.callsTo('POST', '/tickets')).toHaveLength(1));
    expect(api.callsTo('POST', '/tickets')[0]?.body).toEqual({
      categoryId: documentos.id,
      title: 'Revisão de nota',
      description: 'Gostaria de solicitar a revisão da nota da P2.',
      priorityId: priorities[1].id,
    });
  });

  it('keeps the typed text and explains a category that is no longer available (AC4.2.3)', async () => {
    const { api, user } = renderForm({
      'POST /tickets': { status: 422, body: errorBody('CATALOG_ITEM_INACTIVE') },
    });
    await fillForm(user);

    await user.click(screen.getByRole('button', { name: 'Abrir Chamado' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O item escolhido está inativo. Escolha um item ativo.',
    );
    expect(screen.getByLabelText('Título')).toHaveValue('  Revisão de nota  ');
    // The list of categories is read again, since the catalog changed underneath the form.
    await waitFor(() => expect(api.callsTo('GET', '/categories').length).toBeGreaterThan(1));
  });

  it('places a field error of the server next to its field (BR6.3)', async () => {
    const { user } = renderForm({
      'POST /tickets': {
        status: 400,
        body: errorBody('VALIDATION_FAILED', [{ field: 'description', code: 'TOO_SHORT' }]),
      },
    });
    await fillForm(user);

    await user.click(screen.getByRole('button', { name: 'Abrir Chamado' }));

    expect(await screen.findByText('Texto menor que o permitido.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
