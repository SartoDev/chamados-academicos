import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TicketCountGroup } from '@/app/api/types';
import { BarChartWithTable } from './BarChartWithTable';

const GROUPS: TicketCountGroup[] = [
  { id: 'category-documentos', label: 'Documentos', count: 8 },
  { id: 'category-boletos', label: 'Boletos', count: 2 },
];

function renderChart(groups: TicketCountGroup[] = GROUPS) {
  return render(
    <BarChartWithTable
      title="Chamados por categoria"
      groups={groups}
      emptyMessage="Nenhum chamado no período selecionado."
      testId="chart"
    />,
  );
}

describe('BarChartWithTable (BR7.4, BR7.6)', () => {
  it('brings an equivalent table with the label and the quantity of each bar', () => {
    renderChart();

    const table = screen.getByTestId('chart-table');
    expect(within(table).getByRole('columnheader', { name: 'Item' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Quantidade' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: 'Documentos' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '8' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: 'Boletos' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '2' })).toBeInTheDocument();
  });

  it('draws the bars with widths proportional to the largest one, with no chart library', () => {
    renderChart();

    expect(screen.getByTestId('chart-bar-category-documentos')).toHaveStyle({ width: '100%' });
    expect(screen.getByTestId('chart-bar-category-boletos')).toHaveStyle({ width: '25%' });
  });

  it('writes the quantity next to each bar, so nothing depends on the width alone', () => {
    renderChart();

    const bars = screen.getByTestId('chart-bars');
    expect(bars).toHaveTextContent('Documentos');
    expect(bars).toHaveTextContent('8');
  });

  it('keeps the bars out of the reading order, leaving the table as the equivalent', () => {
    renderChart();

    expect(screen.getByTestId('chart-bars')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('table')).toBe(screen.getByTestId('chart-table'));
  });

  it('names the chart with a heading the table container refers to', () => {
    renderChart();

    expect(screen.getByRole('heading', { name: 'Chamados por categoria' })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Tabela equivalente: Chamados por categoria' }),
    ).toBeInTheDocument();
  });

  it('shows the empty message and no table when the period has no group', () => {
    renderChart([]);

    expect(screen.getByTestId('chart-empty')).toHaveTextContent(
      'Nenhum chamado no período selecionado.',
    );
    expect(screen.queryByTestId('chart-table')).not.toBeInTheDocument();
  });

  it('keeps a single group at full width instead of dividing by zero', () => {
    renderChart([{ id: 'category-documentos', label: 'Documentos', count: 0 }]);

    expect(screen.getByTestId('chart-bar-category-documentos')).toHaveStyle({ width: '0%' });
    expect(screen.getByTestId('chart-table')).toBeInTheDocument();
  });
});
