import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MockHandler } from '@/test/api-mock';
import { errorBody } from '@/test/api-mock';
import { makeCurrentUser } from '@/test/fixtures';
import { makeMessage, messagePage, renderConversationDetail } from '@/test/message-fixtures';
import { makeTicketDetail, makeTicketInAnalysis, studentRef } from '@/test/ticket-fixtures';
import { MESSAGE_BODY_MAX_LENGTH } from './conversation-rules';

const student = makeCurrentUser('STUDENT', { id: studentRef.id, name: studentRef.name });

/** Opens the Conversa tab of a ticket the student may write in, with the given send answer. */
async function openComposer(send: MockHandler, ticket = makeTicketInAnalysis()) {
  const conversation = { body: messagePage([makeMessage()]) };
  const rendered = renderConversationDetail(student, ticket, {
    [`GET /tickets/${ticket.id}/messages`]: conversation,
    [`POST /tickets/${ticket.id}/messages`]: send,
  });
  await rendered.user.click(await screen.findByTestId('ticket-tabs-conversation-tab'));
  await screen.findByTestId('message-composer');
  return { ...rendered, ticket };
}

const bodyInput = () => screen.getByTestId('message-composer-body-input');
const submitButton = () => screen.getByTestId('message-composer-submit-button');

describe('MessageComposer (Tela 5, BR2.1, BR5.2, BR5.3, BR5.7)', () => {
  it('sends the message, clears the field and reloads the conversation (WF2)', async () => {
    const stored = makeMessage({ id: 'message-new', body: 'Tem alguma previsão?' });
    const { user, api, ticket } = await openComposer({ status: 201, body: stored });

    await user.type(bodyInput(), 'Tem alguma previsão?');
    await user.click(submitButton());

    await waitFor(() => expect(bodyInput()).toHaveValue(''));
    const sent = api.callsTo('POST', `/tickets/${ticket.id}/messages`);
    expect(sent).toHaveLength(1);
    expect(sent[0].body).toEqual({ body: 'Tem alguma previsão?' });
    // Every send reloads the conversation, to bring what arrived meanwhile (BR5.5).
    await waitFor(() => {
      expect(api.callsTo('GET', `/tickets/${ticket.id}/messages`).length).toBeGreaterThan(1);
    });
  });

  it('counts the characters and refuses a body past the limit before sending (BR2.1)', async () => {
    const { user, api, ticket } = await openComposer({ status: 201, body: makeMessage() });

    await user.type(bodyInput(), 'Oi');
    expect(screen.getByText(`2/${MESSAGE_BODY_MAX_LENGTH} caracteres`)).toBeInTheDocument();

    await user.clear(bodyInput());
    await user.click(submitButton());

    expect(await screen.findByText('Escreva a mensagem.')).toBeInTheDocument();
    expect(api.callsTo('POST', `/tickets/${ticket.id}/messages`)).toHaveLength(0);
  });

  it('refuses a body longer than two thousand characters without calling the API (BR2.1)', async () => {
    const { user, api, ticket } = await openComposer({ status: 201, body: makeMessage() });

    // `paste` avoids typing 2001 keystrokes one by one.
    await user.click(bodyInput());
    await user.paste('a'.repeat(MESSAGE_BODY_MAX_LENGTH + 1));
    await user.click(submitButton());

    expect(
      await screen.findByText(
        `A mensagem deve ter no máximo ${MESSAGE_BODY_MAX_LENGTH} caracteres.`,
      ),
    ).toBeInTheDocument();
    expect(api.callsTo('POST', `/tickets/${ticket.id}/messages`)).toHaveLength(0);
  });

  it('keeps the typed text and offers to try again when the send fails (BR5.3)', async () => {
    const { user, api, ticket } = await openComposer({
      status: 500,
      body: errorBody('INTERNAL_ERROR'),
    });

    await user.type(bodyInput(), 'Mensagem que não saiu.');
    await user.click(submitButton());

    const unsent = await screen.findByTestId('message-composer-unsent-bubble');
    expect(unsent).toHaveTextContent('Não enviado');
    expect(unsent).toHaveTextContent('Mensagem que não saiu.');
    expect(bodyInput()).toHaveValue('Mensagem que não saiu.');

    api.routes[`POST /tickets/${ticket.id}/messages`] = {
      status: 201,
      body: makeMessage({ id: 'message-retry', body: 'Mensagem que não saiu.' }),
    };
    await user.click(screen.getByTestId('message-composer-retry-button'));

    await waitFor(() => expect(bodyInput()).toHaveValue(''));
    expect(api.callsTo('POST', `/tickets/${ticket.id}/messages`)).toHaveLength(2);
  });

  it('shows the translated refusal of a closed ticket and disables the field (CT11, BR5.7)', async () => {
    const { user } = await openComposer({
      status: 409,
      body: errorBody('MESSAGE_TICKET_CLOSED'),
    });

    await user.type(bodyInput(), 'Ainda tenho uma dúvida.');
    await user.click(submitButton());

    expect(await screen.findByTestId('message-composer-error-alert')).toHaveTextContent(
      'Este chamado está encerrado e não aceita novas mensagens.',
    );
    await waitFor(() => expect(bodyInput()).toBeDisabled());
    expect(submitButton()).toBeDisabled();
    expect(screen.queryByTestId('message-composer-unsent-bubble')).not.toBeInTheDocument();
  });

  it('shows the translated refusal of a reader who may not write (BR1.3, CT11)', async () => {
    const { user } = await openComposer({ status: 403, body: errorBody('FORBIDDEN') });

    await user.type(bodyInput(), 'Posso responder?');
    await user.click(submitButton());

    expect(await screen.findByTestId('message-composer-error-alert')).toHaveTextContent(
      'Você não tem permissão para realizar esta ação.',
    );
    expect(bodyInput()).toHaveValue('Posso responder?');
  });

  it('places a server validation error next to the field, keeping the text (BR6.3)', async () => {
    const { user } = await openComposer({
      status: 400,
      body: errorBody('VALIDATION_FAILED', [{ field: 'body', code: 'TOO_LONG' }]),
    });

    await user.type(bodyInput(), 'Texto recusado pelo servidor.');
    await user.click(submitButton());

    expect(await screen.findByText('Texto maior que o permitido.')).toBeInTheDocument();
    expect(bodyInput()).toHaveValue('Texto recusado pelo servidor.');
  });

  it('starts disabled on a ticket that is already closed (BR2.2, AC1.4.2)', async () => {
    const closed = makeTicketDetail({
      status: { id: 'status-closed', key: 'CLOSED', label: 'Encerrado' },
      closedAt: '2026-09-10T10:00:00.000Z',
    });
    await openComposer({ status: 201, body: makeMessage() }, closed);

    expect(bodyInput()).toBeDisabled();
    expect(submitButton()).toBeDisabled();
    expect(screen.getByText('Este chamado está encerrado.')).toBeInTheDocument();
  });
});
