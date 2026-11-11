import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { page } from '@/test/fixtures';
import { LocationProbe } from '@/test/LocationProbe';
import { renderWithProviders } from '@/test/render';
import { makeNotification } from '@/test/ticket-fixtures';
import { NotificationBell } from './NotificationBell';

function renderBell(routes: Record<string, MockHandler> = {}) {
  const api = mockApi({
    'GET /notifications/unread-count': { body: { count: 2 } },
    'GET /notifications': { body: page([makeNotification()]) },
    ...routes,
  });
  return {
    api,
    ...renderWithProviders(
      <>
        <NotificationBell />
        <LocationProbe />
      </>,
      { route: '/tickets' },
    ),
  };
}

describe('NotificationBell and NotificationsPanel (Tela 7, US1.5, BR9.6)', () => {
  it('announces the number of unread notifications (AC1.5.2)', async () => {
    renderBell();

    expect(
      await screen.findByRole('button', { name: 'Notificações: 2 não lidas' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('notification-bell-count')).toHaveTextContent('2');
  });

  it('says when there is nothing unread, without a counter', async () => {
    renderBell({ 'GET /notifications/unread-count': { body: { count: 0 } } });

    expect(
      await screen.findByRole('button', { name: 'Notificações: nenhuma não lida' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('notification-bell-count')).not.toBeInTheDocument();
  });

  it('opens the panel with the most recent notifications, unread written in text', async () => {
    const { user } = renderBell();
    await screen.findByRole('button', { name: 'Notificações: 2 não lidas' });

    await user.click(screen.getByTestId('notification-bell-button'));

    const panel = await screen.findByRole('dialog', { name: 'Notificações' });
    expect(within(panel).getByText('#42 Revisão de nota')).toBeInTheDocument();
    expect(within(panel).getByText('O status do chamado mudou')).toBeInTheDocument();
    expect(within(panel).getByText('não lida')).toBeInTheDocument();
  });

  it('marks the notification as read and opens its ticket (AC1.5.3)', async () => {
    const { api, user } = renderBell({
      'POST /notifications/notification-1/read': { status: 204 },
    });
    await screen.findByRole('button', { name: 'Notificações: 2 não lidas' });
    await user.click(screen.getByTestId('notification-bell-button'));
    const panel = await screen.findByRole('dialog', { name: 'Notificações' });

    await user.click(within(panel).getByTestId('notifications-panel-item-notification-1'));

    await waitFor(() =>
      expect(api.callsTo('POST', '/notifications/notification-1/read')).toHaveLength(1),
    );
    // The ticket opens right after the mark, so the address is checked when it settles.
    await waitFor(() =>
      expect(screen.getByTestId('location-probe')).toHaveTextContent('/tickets/ticket-42'),
    );
  });

  it('marks every notification as read from the panel (AC1.5.4)', async () => {
    const { api, user } = renderBell({ 'POST /notifications/read-all': { status: 204 } });
    await screen.findByRole('button', { name: 'Notificações: 2 não lidas' });
    await user.click(screen.getByTestId('notification-bell-button'));
    const panel = await screen.findByRole('dialog', { name: 'Notificações' });

    await user.click(within(panel).getByTestId('notifications-panel-mark-all-button'));

    await waitFor(() => expect(api.callsTo('POST', '/notifications/read-all')).toHaveLength(1));
  });

  it('closes with Escape and gives the focus back to the bell (BR9.6)', async () => {
    const { user } = renderBell();
    await screen.findByRole('button', { name: 'Notificações: 2 não lidas' });
    await user.click(screen.getByTestId('notification-bell-button'));
    await screen.findByRole('dialog', { name: 'Notificações' });

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('notification-bell-button')).toHaveFocus();
  });

  it('shows the error inside the open panel, with a retry action (CT7)', async () => {
    const { api, user } = renderBell({
      'GET /notifications': { status: 500, body: errorBody('INTERNAL_ERROR') },
    });
    await screen.findByRole('button', { name: 'Notificações: 2 não lidas' });
    await user.click(screen.getByTestId('notification-bell-button'));
    const panel = await screen.findByRole('dialog', { name: 'Notificações' });

    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar suas notificações.',
    );
    api.routes['GET /notifications'] = { body: page([makeNotification()]) };
    await user.click(within(panel).getByRole('button', { name: 'Tentar novamente' }));

    expect(await within(panel).findByText('#42 Revisão de nota')).toBeInTheDocument();
  });

  it('explains an empty list', async () => {
    const { user } = renderBell({ 'GET /notifications': { body: page([]) } });
    await screen.findByRole('button', { name: 'Notificações: 2 não lidas' });

    await user.click(screen.getByTestId('notification-bell-button'));

    expect(await screen.findByTestId('list-state-empty')).toHaveTextContent('Nenhuma notificação.');
  });
});
