import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { makeCurrentUser } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { makeRatingSummary, reportRoutes } from '@/test/report-fixtures';
import { makeTicketDetail, ticketOptionRoutes } from '@/test/ticket-fixtures';
import { IndicatorsTab } from '@/features/reports/IndicatorsTab';
import type { ReportPeriod } from '@/features/reports/reports-api';
import { TicketTabs } from '@/features/tickets/TicketTabs';

const PERIOD: ReportPeriod = { from: '2026-09-01T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' };

/**
 * The two extension points U5 opened in the screens of U2 and of U4. Each one is asserted from
 * both sides: what the screen does when U5 hands it nothing, which must be exactly what it did
 * before, and where the content of U5 lands when it does.
 */
describe('extension point of the Detalhes tab (BR4.1, BR5.1)', () => {
  it('leaves the Detalhes tab exactly as it was when no extra content is passed', () => {
    const ticket = makeTicketDetail();
    render(<TicketTabs ticket={ticket} />);

    const details = screen.getByTestId('ticket-details-tab');
    expect(details).toHaveTextContent('Descrição');
    expect(details).toHaveTextContent(ticket.description);
    // Only the two tabs of U2; the extension point never adds one.
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Detalhes',
      'Histórico',
    ]);
  });

  it('renders the extra content inside the Detalhes panel, below the details themselves', () => {
    render(
      <TicketTabs
        ticket={makeTicketDetail()}
        detailsExtra={<p data-testid="extension-probe">Bloco de avaliação</p>}
      />,
    );

    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByTestId('extension-probe')).toBeInTheDocument();
    expect(within(panel).getByTestId('ticket-details-tab')).toBeInTheDocument();
    // It is content of the Detalhes tab, never a sibling tab like the Conversa of U3.
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Detalhes',
      'Histórico',
    ]);
    const details = within(panel).getByTestId('ticket-details-tab');
    const probe = within(panel).getByTestId('extension-probe');
    expect(details.compareDocumentPosition(probe) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps registering a sibling tab through extraTabs, the way U3 does', () => {
    render(
      <TicketTabs
        ticket={makeTicketDetail()}
        extraTabs={[{ value: 'probe', label: 'Sonda', content: <p>Conteúdo</p> }]}
        detailsExtra={<p data-testid="extension-probe">Bloco de avaliação</p>}
      />,
    );

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Detalhes',
      'Histórico',
      'Sonda',
    ]);
    expect(screen.getByTestId('extension-probe')).toBeInTheDocument();
  });
});

describe('extension point of the indicators panel (BR4.1, BR5.4)', () => {
  function renderPanel(summary = makeRatingSummary()) {
    mockApi({
      'GET /auth/me': { body: makeCurrentUser('MANAGER') },
      ...ticketOptionRoutes,
      ...reportRoutes,
      'GET /reports/ratings': { body: summary },
    });
    return renderWithProviders(<IndicatorsTab period={PERIOD} role="MANAGER" />);
  }

  it('puts the rating card in the same grid as the two average times', async () => {
    renderPanel();

    const rating = await screen.findByTestId('indicators-rating-card');
    const resolution = screen.getByTestId('indicators-resolution-card');
    const handling = screen.getByTestId('indicators-handling-card');
    expect(rating.parentElement).toBe(resolution.parentElement);
    expect(rating.parentElement).toBe(handling.parentElement);
    // Three cards in one row on a wide screen, one column on a narrow one.
    expect(rating.parentElement?.className).toContain('grid-cols-1');
    expect(rating.parentElement?.className).toContain('lg:grid-cols-3');
  });

  it('shows the average and the sample the API answered', async () => {
    renderPanel(makeRatingSummary({ averageScore: 4.2, count: 5 }));

    expect(await screen.findByTestId('indicators-rating-card-value')).toHaveTextContent('4,2');
    expect(screen.getByTestId('indicators-rating-card-sample')).toHaveTextContent(
      'Base: 5 avaliações',
    );
  });

  it('shows a dash in the card when the period holds no rating (BR3.2)', async () => {
    renderPanel(makeRatingSummary({ averageScore: null, count: 0 }));

    expect(await screen.findByTestId('indicators-rating-card-value')).toHaveTextContent('—');
  });

  it('says in the footnote that the rating follows the closing window, like the times', async () => {
    renderPanel();

    expect(await screen.findByTestId('indicators-period-note')).toHaveTextContent(
      'os tempos médios e a avaliação média consideram os chamados encerrados no período',
    );
  });

  it('adds no tab and no card list to the panel of U4', async () => {
    renderPanel();

    await screen.findByTestId('indicators-rating-card');
    // The status counts keep their own grid of four; the rating never joins them.
    const statusCard = screen.getByTestId('indicators-count-status-open');
    expect(statusCard.parentElement).not.toBe(
      screen.getByTestId('indicators-rating-card').parentElement,
    );
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });
});
