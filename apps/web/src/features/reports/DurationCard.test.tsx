import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DurationCard } from './DurationCard';

const DESCRIPTION = 'Da abertura até o encerramento mais recente.';

function renderCard(seconds: number | null, sampleSize: number) {
  return render(
    <DurationCard
      label="Tempo médio de resolução"
      seconds={seconds}
      sampleSize={sampleSize}
      description={DESCRIPTION}
      testId="duration-card"
    />,
  );
}

describe('DurationCard (BR4.3, BR4.4, BR7.4)', () => {
  it('shows the value in a readable unit', () => {
    renderCard(93_600, 4);

    expect(screen.getByTestId('duration-card-value')).toHaveTextContent('1 d 2 h');
  });

  it('writes the same value out next to the number (BR7.4)', () => {
    renderCard(93_600, 4);

    expect(screen.getByTestId('duration-card-sample')).toHaveTextContent('1 dia e 2 horas');
  });

  it('shows the sample of this average alone (BR4.3)', () => {
    renderCard(5400, 2);

    expect(screen.getByTestId('duration-card-sample')).toHaveTextContent('Base: 2 chamados');
  });

  it('agrees the singular with a sample of one', () => {
    renderCard(3600, 1);

    expect(screen.getByTestId('duration-card-sample')).toHaveTextContent('Base: 1 chamado');
  });

  it('shows a dash and the explanation without a sample, never a zero (BR2.2)', () => {
    renderCard(null, 0);

    expect(screen.getByTestId('duration-card-value')).toHaveTextContent('—');
    expect(screen.getByTestId('duration-card-value')).not.toHaveTextContent('0');
    expect(screen.getByTestId('duration-card-sample')).toHaveTextContent(
      'Nenhum chamado encerrado no período selecionado.',
    );
  });

  it('shows the dash when the sample is empty even if a number arrives', () => {
    renderCard(1200, 0);

    expect(screen.getByTestId('duration-card-value')).toHaveTextContent('—');
  });

  it('shows no goal, threshold or comparison next to the time (BR4.4)', () => {
    renderCard(93_600, 4);

    const card = screen.getByTestId('duration-card');
    expect(card).toHaveTextContent(DESCRIPTION);
    expect(card.textContent).not.toMatch(/meta|limite|alvo|ideal|acima|abaixo/i);
  });

  it('always carries the label of the number in text', () => {
    renderCard(93_600, 4);

    expect(screen.getByText('Tempo médio de resolução')).toBeInTheDocument();
  });
});
