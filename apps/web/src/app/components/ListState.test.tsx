import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { listStatusOf } from './list-status';
import { ListState } from './ListState';

const texts = {
  emptyMessage: 'Nenhum setor cadastrado.',
  errorMessage: 'Não foi possível carregar os setores.',
};

describe('ListState (BR7.4, CT7)', () => {
  it('shows a skeleton with an announced loading text while loading', () => {
    render(<ListState status="loading" {...texts} onRetry={vi.fn()} skeletonRows={3} />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(
      screen.getByTestId('list-state-loading').querySelectorAll('[data-slot="skeleton"]'),
    ).toHaveLength(3);
  });

  it('explains an empty list', () => {
    render(<ListState status="empty" {...texts} onRetry={vi.fn()} />);

    expect(screen.getByText('Nenhum setor cadastrado.')).toBeInTheDocument();
  });

  it('shows the error with a retry action', async () => {
    const onRetry = vi.fn();
    render(<ListState status="error" {...texts} onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os setores.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders the content when ready', () => {
    render(
      <ListState status="ready" {...texts} onRetry={vi.fn()}>
        <table aria-label="Setores" />
      </ListState>,
    );

    expect(screen.getByRole('table', { name: 'Setores' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('derives the state of a list query', () => {
    expect(listStatusOf({ isPending: true, isError: false })).toBe('loading');
    expect(listStatusOf({ isPending: false, isError: true })).toBe('error');
    expect(listStatusOf({ isPending: false, isError: false, data: { items: [] } })).toBe('empty');
    expect(listStatusOf({ isPending: false, isError: false })).toBe('empty');
    expect(listStatusOf({ isPending: false, isError: false, data: { items: [1] } })).toBe('ready');
  });
});
