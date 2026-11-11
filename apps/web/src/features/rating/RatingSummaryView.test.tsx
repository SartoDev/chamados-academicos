import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Rating } from '@/app/api/types';
import { RatingSummaryView } from './RatingSummaryView';

function makeRating(overrides: Partial<Rating> = {}): Rating {
  return {
    ticketId: 'ticket-42',
    score: 4,
    comment: 'Atendimento rápido e cordial.',
    ratedAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

describe('RatingSummaryView (BR5.2, BR5.5)', () => {
  it('writes the score with its label, never the number alone (AC5.3.4)', () => {
    render(<RatingSummaryView rating={makeRating()} />);

    expect(screen.getByTestId('rating-summary-score')).toHaveTextContent('4 — Bom');
  });

  it.each([
    [1, 'Muito ruim'],
    [3, 'Regular'],
    [5, 'Muito bom'],
  ])('writes the fixed label of the score %s', (score, label) => {
    render(<RatingSummaryView rating={makeRating({ score })} />);

    expect(screen.getByTestId('rating-summary-score')).toHaveTextContent(`${score} — ${label}`);
  });

  it('shows the comment in full, with its line breaks preserved (BR2.2)', () => {
    const comment = 'Primeira linha.\nSegunda linha.';
    render(<RatingSummaryView rating={makeRating({ comment })} />);

    const element = screen.getByTestId('rating-summary-comment');
    expect(element).toHaveTextContent('Primeira linha.');
    expect(element).toHaveTextContent('Segunda linha.');
    expect(element.textContent).toBe(comment);
  });

  it('interprets no markup inside the comment (BR2.2)', () => {
    render(<RatingSummaryView rating={makeRating({ comment: '**não é negrito**' })} />);

    const element = screen.getByTestId('rating-summary-comment');
    expect(element.textContent).toBe('**não é negrito**');
    expect(element.querySelector('strong')).toBeNull();
  });

  it('says there is no comment instead of leaving an empty space', () => {
    render(<RatingSummaryView rating={makeRating({ comment: null })} />);

    expect(screen.getByTestId('rating-summary-no-comment')).toHaveTextContent('Sem comentário.');
    expect(screen.queryByTestId('rating-summary-comment')).not.toBeInTheDocument();
  });

  it('shows the instant the rating was left (BR5.2)', () => {
    render(<RatingSummaryView rating={makeRating()} />);

    expect(screen.getByTestId('rating-summary-rated-at')).toHaveTextContent('Avaliado em');
    expect(screen.getByTestId('rating-summary-rated-at')).toHaveTextContent('10/09/2026');
  });

  it('announces the notice of a rating that was just stored (WF1)', () => {
    render(<RatingSummaryView rating={makeRating()} notice="Avaliação registrada." />);

    const notice = screen.getByTestId('rating-summary-notice');
    expect(notice).toHaveTextContent('Avaliação registrada.');
    expect(notice).toHaveAttribute('role', 'status');
  });
});
