import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { renderWithProviders } from '@/test/render';
import { RatingForm } from './RatingForm';
import { makeRating } from '@/test/ticket-fixtures';

const TICKET_ID = 'ticket-42';
const RATING_PATH = `/tickets/${TICKET_ID}/rating`;

function renderForm(routes: Record<string, MockHandler> = {}) {
  const api = mockApi({
    [`PUT ${RATING_PATH}`]: { body: makeRating({ score: 5 }) },
    [`GET ${RATING_PATH}`]: { status: 404, body: errorBody('RATING_NOT_FOUND') },
    ...routes,
  });
  return { api, ...renderWithProviders(<RatingForm ticketId={TICKET_ID} />) };
}

type TestUser = ReturnType<typeof renderForm>['user'];

/** Pastes instead of typing: one event per field, whatever the length of the text. */
async function writeComment(user: TestUser, text: string) {
  await user.click(screen.getByTestId('rating-form-comment-input'));
  await user.paste(text);
}

async function confirm(user: TestUser) {
  await user.click(screen.getByTestId('rating-form-submit-button'));
  const dialog = await screen.findByTestId('confirm-rating-dialog');
  await user.click(within(dialog).getByTestId('confirm-rating-dialog-confirm-button'));
}

describe('RatingForm (BR2.1, BR2.2, BR5.3)', () => {
  it('refuses to send without a score and never calls the API (BR2.1)', async () => {
    const { api, user } = renderForm();

    await user.click(screen.getByTestId('rating-form-submit-button'));

    expect(await screen.findByTestId('rating-form-score-error')).toHaveTextContent(
      'Escolha uma nota para enviar a avaliação.',
    );
    expect(screen.queryByTestId('confirm-rating-dialog')).not.toBeInTheDocument();
    expect(api.callsTo('PUT', RATING_PATH)).toHaveLength(0);
  });

  it('offers the five options with their labels written out (BR5.3, AC5.3.4)', () => {
    renderForm();

    for (const [score, label] of [
      [1, 'Muito ruim'],
      [2, 'Ruim'],
      [3, 'Regular'],
      [4, 'Bom'],
      [5, 'Muito bom'],
    ] as const) {
      expect(screen.getByRole('radio', { name: `${score} — ${label}` })).toBeInTheDocument();
    }
  });

  it('counts the characters of the comment as they are typed (BR2.2, CT8)', async () => {
    const { user } = renderForm();

    expect(screen.getByText('0/500 caracteres')).toBeInTheDocument();
    await writeComment(user, 'Obrigada!');

    expect(screen.getByText('9/500 caracteres')).toBeInTheDocument();
  });

  it('places the error below the comment when it passes the limit, on leaving the field', async () => {
    const { api, user } = renderForm();

    await user.click(screen.getByTestId('rating-score-option-4'));
    await writeComment(user, 'a'.repeat(501));
    await user.tab();

    expect(
      await screen.findByText('O comentário deve ter no máximo 500 caracteres.'),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId('rating-form-submit-button'));
    expect(screen.queryByTestId('confirm-rating-dialog')).not.toBeInTheDocument();
    expect(api.callsTo('PUT', RATING_PATH)).toHaveLength(0);
  });

  it('asks for confirmation before sending and sends nothing when it is cancelled (BR5.3)', async () => {
    const { api, user } = renderForm();

    await user.click(screen.getByTestId('rating-score-option-5'));
    await user.click(screen.getByTestId('rating-form-submit-button'));
    const dialog = await screen.findByTestId('confirm-rating-dialog');

    expect(dialog).toHaveTextContent('A avaliação é definitiva');
    expect(dialog).toHaveTextContent('5 — Muito bom');
    await user.click(within(dialog).getByTestId('confirm-rating-dialog-cancel-button'));
    expect(api.callsTo('PUT', RATING_PATH)).toHaveLength(0);
  });

  it('sends the score and the trimmed comment once the confirmation is accepted', async () => {
    const { api, user } = renderForm();

    await user.click(screen.getByTestId('rating-score-option-5'));
    await writeComment(user, '  Tudo certo.  ');
    await confirm(user);

    await waitFor(() => expect(api.callsTo('PUT', RATING_PATH)).toHaveLength(1));
    expect(api.callsTo('PUT', RATING_PATH)[0]?.body).toEqual({
      score: 5,
      comment: 'Tudo certo.',
    });
  });

  it('omits the comment entirely when nothing was written (BR2.2)', async () => {
    const { api, user } = renderForm();

    await user.click(screen.getByTestId('rating-score-option-3'));
    await confirm(user);

    await waitFor(() => expect(api.callsTo('PUT', RATING_PATH)).toHaveLength(1));
    expect(api.callsTo('PUT', RATING_PATH)[0]?.body).toEqual({ score: 3 });
  });

  it('translates the two conflicts and keeps what was typed (BR5.6, CT8)', async () => {
    const { user } = renderForm({
      [`PUT ${RATING_PATH}`]: { status: 409, body: errorBody('RATING_ALREADY_EXISTS') },
    });

    await user.click(screen.getByTestId('rating-score-option-2'));
    await writeComment(user, 'Demorou demais.');
    await confirm(user);

    expect(await screen.findByTestId('rating-form-error-alert')).toHaveTextContent(
      'Este chamado já foi avaliado.',
    );
    expect(screen.getByTestId('rating-form-comment-input')).toHaveValue('Demorou demais.');
    expect(screen.getByTestId('rating-score-option-2')).toBeChecked();
  });

  it('translates a ticket that is no longer closed (BR1.2, BR5.6)', async () => {
    const { user } = renderForm({
      [`PUT ${RATING_PATH}`]: { status: 409, body: errorBody('RATING_TICKET_NOT_CLOSED') },
    });

    await user.click(screen.getByTestId('rating-score-option-4'));
    await confirm(user);

    expect(await screen.findByTestId('rating-form-error-alert')).toHaveTextContent(
      'Este chamado não está encerrado.',
    );
  });

  it('places a server validation error below the field it names (CT8, BR6.3)', async () => {
    const { user } = renderForm({
      [`PUT ${RATING_PATH}`]: {
        status: 400,
        body: errorBody('VALIDATION_FAILED', [{ field: 'comment', code: 'TOO_LONG' }]),
      },
    });

    await user.click(screen.getByTestId('rating-score-option-1'));
    await writeComment(user, 'Texto que o servidor recusa.');
    await confirm(user);

    expect(await screen.findByText('Texto maior que o permitido.')).toBeInTheDocument();
    expect(screen.getByTestId('rating-form-comment-input')).toHaveValue(
      'Texto que o servidor recusa.',
    );
  });

  it('keeps the typed text and offers to try again after a failure of the server', async () => {
    const { api, user } = renderForm({
      [`PUT ${RATING_PATH}`]: { status: 500, body: errorBody('INTERNAL_ERROR') },
    });

    await user.click(screen.getByTestId('rating-score-option-4'));
    await writeComment(user, 'Quase lá.');
    await confirm(user);
    expect(await screen.findByTestId('rating-form-error-alert')).toBeInTheDocument();

    await confirm(user);

    await waitFor(() => expect(api.callsTo('PUT', RATING_PATH)).toHaveLength(2));
    expect(api.callsTo('PUT', RATING_PATH)[1]?.body).toEqual({
      score: 4,
      comment: 'Quase lá.',
    });
  });
});
