import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CurrentUser, TicketDetail } from '@/app/api/types';
import { errorBody, mockApi, type MockHandler } from '@/test/api-mock';
import { makeCurrentUser } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import {
  agentRef,
  makeClosedTicket,
  makeRating,
  makeTicketInAnalysis,
  studentRef,
} from '@/test/ticket-fixtures';
import { RatingSection } from './RatingSection';

const requester = makeCurrentUser('STUDENT', { id: studentRef.id, name: studentRef.name });
const agent = makeCurrentUser('AGENT', { id: agentRef.id, name: agentRef.name });

function renderSection(
  user: CurrentUser,
  ticket: TicketDetail,
  routes: Record<string, MockHandler> = {},
) {
  const api = mockApi({
    [`GET /tickets/${ticket.id}/rating`]: { status: 404, body: errorBody('RATING_NOT_FOUND') },
    ...routes,
  });
  return { api, ...renderWithProviders(<RatingSection ticket={ticket} user={user} />) };
}

describe('RatingSection (BR5.1, BR5.2, BR1.3)', () => {
  it('shows nothing at all while the ticket is not closed, and asks the API nothing', async () => {
    const { api } = renderSection(requester, makeTicketInAnalysis());

    await waitFor(() => expect(api.callsTo('GET', '/tickets/ticket-42/rating')).toHaveLength(0));
    expect(screen.queryByTestId('rating-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rating-summary')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rating-section-loading')).not.toBeInTheDocument();
  });

  it('offers the form to the requester of a closed ticket that was never rated (BR5.1)', async () => {
    renderSection(requester, makeClosedTicket());

    expect(await screen.findByTestId('rating-form')).toBeInTheDocument();
    expect(screen.queryByTestId('rating-summary')).not.toBeInTheDocument();
  });

  it('shows nothing to somebody who is not the requester while there is no rating', async () => {
    const { api } = renderSection(agent, makeClosedTicket());

    await waitFor(() => expect(api.callsTo('GET', '/tickets/ticket-42/rating')).toHaveLength(1));
    await waitFor(() =>
      expect(screen.queryByTestId('rating-section-loading')).not.toBeInTheDocument(),
    );
    expect(screen.queryByTestId('rating-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rating-summary')).not.toBeInTheDocument();
  });

  it('shows the stored rating to the requester, in place of the form (WF1, BR5.2)', async () => {
    renderSection(requester, makeClosedTicket(), {
      'GET /tickets/ticket-42/rating': { body: makeRating({ score: 5 }) },
    });

    expect(await screen.findByTestId('rating-summary-score')).toHaveTextContent('5 — Muito bom');
    expect(screen.queryByTestId('rating-form')).not.toBeInTheDocument();
  });

  it('shows the stored rating to whoever else may read the ticket (BR1.3)', async () => {
    renderSection(agent, makeClosedTicket(), {
      'GET /tickets/ticket-42/rating': { body: makeRating({ score: 2, comment: 'Demorou.' }) },
    });

    expect(await screen.findByTestId('rating-summary-score')).toHaveTextContent('2 — Ruim');
    expect(screen.getByTestId('rating-summary-comment')).toHaveTextContent('Demorou.');
    expect(screen.queryByTestId('rating-form')).not.toBeInTheDocument();
  });

  it('announces the loading state while the rating is on its way (CT7)', () => {
    renderSection(requester, makeClosedTicket());

    const loading = screen.getByTestId('rating-section-loading');
    expect(loading).toHaveAttribute('role', 'status');
    expect(loading).toHaveTextContent('Carregando a avaliação...');
  });

  it('shows the error state with a retry that asks the API again (CT7)', async () => {
    const { api, user } = renderSection(requester, makeClosedTicket(), {
      'GET /tickets/ticket-42/rating': { status: 500, body: errorBody('INTERNAL_ERROR') },
    });
    const retry = await screen.findByTestId('rating-section-retry-button');
    const before = api.callsTo('GET', '/tickets/ticket-42/rating').length;

    await user.click(retry);

    await waitFor(() =>
      expect(api.callsTo('GET', '/tickets/ticket-42/rating').length).toBeGreaterThan(before),
    );
    expect(screen.getByTestId('rating-section-error')).toHaveTextContent(
      'Não foi possível carregar a avaliação.',
    );
  });

  it('replaces the form with the stored rating right after a successful send (WF1 step 8)', async () => {
    let stored: unknown = null;
    const { user } = renderSection(requester, makeClosedTicket(), {
      'GET /tickets/ticket-42/rating': () =>
        stored ? { body: stored } : { status: 404, body: errorBody('RATING_NOT_FOUND') },
      'PUT /tickets/ticket-42/rating': () => {
        stored = makeRating({ score: 4, comment: 'Resolvido.' });
        return { body: stored };
      },
    });
    await screen.findByTestId('rating-form');

    await user.click(screen.getByTestId('rating-score-option-4'));
    await user.click(screen.getByTestId('rating-form-submit-button'));
    await user.click(await screen.findByTestId('confirm-rating-dialog-confirm-button'));

    expect(await screen.findByTestId('rating-summary-score')).toHaveTextContent('4 — Bom');
    expect(screen.queryByTestId('rating-form')).not.toBeInTheDocument();
  });
});
