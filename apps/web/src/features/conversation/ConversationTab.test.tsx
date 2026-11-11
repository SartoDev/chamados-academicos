import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, type MockHandler } from '@/test/api-mock';
import { makeCurrentUser } from '@/test/fixtures';
import {
  makeAgentMessage,
  makeConversation,
  makeMessage,
  messagePage,
  renderConversationDetail as renderDetail,
} from '@/test/message-fixtures';
import {
  makeClosedTicket,
  makeTicketDetail,
  makeTicketInAnalysis,
  managerRef,
  otherAgentRef,
  studentRef,
} from '@/test/ticket-fixtures';

const student = makeCurrentUser('STUDENT', { id: studentRef.id, name: studentRef.name });
const otherAgent = makeCurrentUser('AGENT', { id: otherAgentRef.id, name: otherAgentRef.name });
const manager = makeCurrentUser('MANAGER', { id: managerRef.id, name: managerRef.name });
const admin = makeCurrentUser('ADMIN');

describe('ConversationTab (Tela 5, US1.4, BR5.1)', () => {
  it('offers the tab to the requester, to agents and to managers, never to the administrator', async () => {
    const ticket = makeTicketInAnalysis();

    const { unmount } = renderDetail(student, ticket);
    expect(await screen.findByTestId('ticket-tabs-conversation-tab')).toHaveTextContent('Conversa');
    unmount();

    const second = renderDetail(otherAgent, ticket);
    expect(await screen.findByTestId('ticket-tabs-conversation-tab')).toBeInTheDocument();
    second.unmount();

    const third = renderDetail(manager, ticket);
    expect(await screen.findByTestId('ticket-tabs-conversation-tab')).toBeInTheDocument();
    third.unmount();

    renderDetail(admin, ticket);
    await screen.findByTestId('ticket-tabs-details-tab');
    expect(screen.queryByTestId('ticket-tabs-conversation-tab')).not.toBeInTheDocument();
  });

  it('asks for the most recent page and shows it in chronological order (BR5.4)', async () => {
    const ticket = makeTicketInAnalysis();
    const messages = makeConversation(3);
    const { api, user } = renderDetail(student, ticket, {
      [`GET /tickets/${ticket.id}/messages`]: { body: messagePage(messages) },
    });

    await user.click(await screen.findByTestId('ticket-tabs-conversation-tab'));

    const list = await screen.findByTestId('conversation-message-list');
    expect(
      within(list)
        .getAllByTestId('message-bubble-body')
        .map((node) => node.textContent),
    ).toEqual(['Mensagem 1.', 'Mensagem 2.', 'Mensagem 3.']);
    const call = api.callsTo('GET', `/tickets/${ticket.id}/messages`)[0];
    expect(call.query.get('order')).toBe('desc');
    expect(call.query.get('page')).toBe('1');
    expect(call.query.get('pageSize')).toBe('50');
  });

  it('drops the tab and puts the focus back on Detalhes when the read answers 404 (BR5.1)', async () => {
    const ticket = makeTicketInAnalysis();
    const { user } = renderDetail(otherAgent, ticket, {
      [`GET /tickets/${ticket.id}/messages`]: {
        status: 404,
        body: errorBody('TICKET_NOT_FOUND'),
      },
    });

    await user.click(await screen.findByTestId('ticket-tabs-conversation-tab'));

    await waitFor(() => {
      expect(screen.queryByTestId('ticket-tabs-conversation-tab')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('ticket-details-tab')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-tabs-details-tab')).toHaveFocus();
  });

  it('loads older messages without repeating one already on screen (BR5.4, R-06)', async () => {
    const ticket = makeTicketInAnalysis();
    const chronological = makeConversation(6);
    const arrived = makeAgentMessage({
      id: 'message-arrived',
      body: 'Chegou enquanto você lia.',
      sentAt: '2026-09-10T13:00:00.000Z',
    });
    // The window slides: page two is asked for after a new message reached the collection, so
    // it repeats the message that closed page one (review finding R-06).
    const { user } = renderDetail(student, ticket, {
      [`GET /tickets/${ticket.id}/messages`]: (request) => {
        const requestedPage = Number(request.query.get('page') ?? '1');
        return requestedPage === 1
          ? { body: messagePage(chronological, 1, 3, 6) }
          : { body: messagePage([...chronological, arrived], requestedPage, 3, 7) };
      },
    });

    await user.click(await screen.findByTestId('ticket-tabs-conversation-tab'));
    const list = await screen.findByTestId('conversation-message-list');
    expect(within(list).getAllByTestId('message-bubble')).toHaveLength(3);

    await user.click(screen.getByTestId('conversation-load-previous-button'));

    await waitFor(() => {
      expect(within(list).getAllByTestId('message-bubble')).toHaveLength(5);
    });
    const bodies = within(list)
      .getAllByTestId('message-bubble-body')
      .map((node) => node.textContent);
    // Nothing repeated, nothing lost between the two windows.
    expect(new Set(bodies).size).toBe(bodies.length);
    expect(bodies).toEqual([
      'Mensagem 2.',
      'Mensagem 3.',
      'Mensagem 4.',
      'Mensagem 5.',
      'Mensagem 6.',
    ]);
  });

  it('reloads the conversation on "Atualizar" and announces what arrived (BR5.5)', async () => {
    const ticket = makeTicketInAnalysis();
    const messages = makeConversation(1);
    const routes: Record<string, MockHandler> = {
      [`GET /tickets/${ticket.id}/messages`]: { body: messagePage(messages) },
    };
    const { api, user } = renderDetail(student, ticket, routes);

    await user.click(await screen.findByTestId('ticket-tabs-conversation-tab'));
    await screen.findByTestId('conversation-message-list');

    const arrived = makeAgentMessage({ body: 'Chegou uma resposta.' });
    api.routes[`GET /tickets/${ticket.id}/messages`] = {
      body: messagePage([...messages, arrived]),
    };
    await user.click(screen.getByTestId('conversation-refresh-button'));

    expect(await screen.findByText('Chegou uma resposta.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('conversation-announcer')).toHaveTextContent('1 nova mensagem.');
    });
  });

  it('shows the composer to whoever writes and hides it from a reader (BR5.2, BR1.3)', async () => {
    const ticket = makeTicketInAnalysis();
    const routes: Record<string, MockHandler> = {
      [`GET /tickets/${ticket.id}/messages`]: { body: messagePage([makeMessage()]) },
    };

    const first = renderDetail(student, ticket, routes);
    await first.user.click(await screen.findByTestId('ticket-tabs-conversation-tab'));
    expect(await screen.findByTestId('message-composer')).toBeInTheDocument();
    first.unmount();

    const second = renderDetail(otherAgent, ticket, routes);
    await second.user.click(await screen.findByTestId('ticket-tabs-conversation-tab'));
    await screen.findByTestId('conversation-message-list');
    expect(screen.queryByTestId('message-composer')).not.toBeInTheDocument();
  });

  it('keeps the composer on screen, disabled, on a closed ticket (BR2.2, AC1.4.2)', async () => {
    const ticket = makeClosedTicket();
    const { user } = renderDetail(student, ticket, {
      [`GET /tickets/${ticket.id}/messages`]: { body: messagePage([makeMessage()]) },
    });

    await user.click(await screen.findByTestId('ticket-tabs-conversation-tab'));

    expect(await screen.findByTestId('message-composer-body-input')).toBeDisabled();
    expect(screen.getByTestId('message-composer-submit-button')).toBeDisabled();
    expect(screen.getByText('Este chamado está encerrado.')).toBeInTheDocument();
    expect(screen.getByTestId('conversation-message-list')).toBeInTheDocument();
  });

  it('shows the empty state of a conversation without messages (BR5.3)', async () => {
    const ticket = makeTicketDetail();
    const { user } = renderDetail(student, ticket, {
      [`GET /tickets/${ticket.id}/messages`]: { body: messagePage([]) },
    });

    await user.click(await screen.findByTestId('ticket-tabs-conversation-tab'));

    expect(await screen.findByTestId('list-state-empty')).toHaveTextContent(
      'Nenhuma mensagem ainda. Escreva a primeira.',
    );
  });

  it('shows the error state with a retry when the read fails (CT7)', async () => {
    const ticket = makeTicketInAnalysis();
    const { api, user } = renderDetail(student, ticket, {
      [`GET /tickets/${ticket.id}/messages`]: { status: 500, body: errorBody('INTERNAL_ERROR') },
    });

    await user.click(await screen.findByTestId('ticket-tabs-conversation-tab'));

    const error = await screen.findByTestId('list-state-error');
    expect(error).toHaveTextContent('Não foi possível carregar a conversa.');
    api.routes[`GET /tickets/${ticket.id}/messages`] = { body: messagePage(makeConversation(1)) };
    await user.click(screen.getByTestId('list-state-retry-button'));
    expect(await screen.findByText('Mensagem 1.')).toBeInTheDocument();
  });
});
