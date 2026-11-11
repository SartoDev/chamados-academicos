import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi, type MockHandler } from '@/test/api-mock';
import { page, student } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { makeNotification, ticketOptionRoutes } from '@/test/ticket-fixtures';

function renderPage(routes: Record<string, MockHandler> = {}, route = '/notifications') {
  const api = mockApi({
    'GET /auth/me': { body: student },
    ...ticketOptionRoutes,
    'GET /notifications': { body: page([makeNotification()]) },
    ...routes,
  });
  return { api, ...renderApp(route) };
}

const lastListQuery = (api: ReturnType<typeof renderPage>['api']) =>
  api.callsTo('GET', '/notifications').at(-1)?.query;

describe('NotificationsPage ("Ver todas", BR6.4)', () => {
  it('lists the notifications of the actor with the ticket they belong to', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Notificações' })).toBeInTheDocument();
    expect(await screen.findByText('#42 Revisão de nota')).toBeInTheDocument();
    expect(screen.getByText('O status do chamado mudou')).toBeInTheDocument();
  });

  it('filters the unread ones through the address', async () => {
    const { api, user } = renderPage();
    await screen.findByText('#42 Revisão de nota');

    await user.click(screen.getByTestId('notifications-page-unread-filter'));

    await waitFor(() => expect(lastListQuery(api)?.get('unreadOnly')).toBe('true'));
  });

  it('marks every notification as read (AC1.5.4)', async () => {
    const { api, user } = renderPage({ 'POST /notifications/read-all': { status: 204 } });
    await screen.findByText('#42 Revisão de nota');

    await user.click(screen.getByTestId('notifications-page-mark-all-button'));

    await waitFor(() => expect(api.callsTo('POST', '/notifications/read-all')).toHaveLength(1));
  });

  it('opens the ticket of a notification, marking it as read on the way (AC1.5.3)', async () => {
    const { api, user } = renderPage({
      'POST /notifications/notification-1/read': { status: 204 },
      'GET /tickets/ticket-42': { status: 404, body: { error: { code: 'TICKET_NOT_FOUND' } } },
    });
    await screen.findByText('#42 Revisão de nota');

    await user.click(screen.getByTestId('notifications-page-item-notification-1'));

    await waitFor(() =>
      expect(api.callsTo('POST', '/notifications/notification-1/read')).toHaveLength(1),
    );
    // The ticket opens right after the mark, so the address is checked when it settles.
    await waitFor(() =>
      expect(screen.getByTestId('location-probe')).toHaveTextContent('/tickets/ticket-42'),
    );
  });

  it('pages the list', async () => {
    const { api, user } = renderPage({
      'GET /notifications': { body: page([makeNotification()], { total: 25 }) },
    });
    await screen.findByText('#42 Revisão de nota');

    await user.click(screen.getByRole('button', { name: 'Próxima' }));

    await waitFor(() => expect(lastListQuery(api)?.get('page')).toBe('2'));
  });

  it('explains an empty list', async () => {
    renderPage({ 'GET /notifications': { body: page([]) } });

    expect(await screen.findByTestId('list-state-empty')).toHaveTextContent('Nenhuma notificação.');
  });
});
