import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RatingCard } from './RatingCard';

function renderCard(averageScore: number | null, count: number) {
  return render(<RatingCard averageScore={averageScore} count={count} testId="rating-card" />);
}

describe('RatingCard (BR3.2, BR5.4)', () => {
  it('shows the average with one decimal place', () => {
    renderCard(4.25, 8);

    expect(screen.getByTestId('rating-card-value')).toHaveTextContent('4,3');
  });

  it('shows the scale and the sample next to the number', () => {
    renderCard(3, 8);

    expect(screen.getByTestId('rating-card-sample')).toHaveTextContent('De 1 a 5');
    expect(screen.getByTestId('rating-card-sample')).toHaveTextContent('Base: 8 avaliações');
  });

  it('writes the sample in the singular for a single rating', () => {
    renderCard(5, 1);

    expect(screen.getByTestId('rating-card-sample')).toHaveTextContent('Base: 1 avaliação');
  });

  it('shows a dash and the explanation instead of a zero when nothing was rated (BR3.2)', () => {
    renderCard(null, 0);

    expect(screen.getByTestId('rating-card-value')).toHaveTextContent('—');
    expect(screen.getByTestId('rating-card-value')).not.toHaveTextContent('0');
    expect(screen.getByTestId('rating-card-sample')).toHaveTextContent(
      'Nenhuma avaliação nos chamados encerrados no período selecionado.',
    );
  });

  it('shows a dash as well when an average arrives with an empty sample', () => {
    renderCard(4, 0);

    expect(screen.getByTestId('rating-card-value')).toHaveTextContent('—');
  });

  it('names the window the number answers, so it is never read blind (BR5.4)', () => {
    renderCard(4, 3);

    expect(screen.getByTestId('rating-card')).toHaveTextContent(
      'sobre os chamados encerrados no período',
    );
  });

  it('carries no goal and no threshold with the value (BR4.4 of U4)', () => {
    renderCard(2, 3);

    const card = screen.getByTestId('rating-card');
    expect(card.textContent).not.toMatch(/meta|limiar|objetivo/i);
  });
});
