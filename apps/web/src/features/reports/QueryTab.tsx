import { listStatusOf } from '@/app/components/list-status';
import { ListState } from '@/app/components/ListState';
import { PaginationControls } from '@/app/components/PaginationControls';
import { messageForError } from '@/app/i18n/error-code-messages';
import {
  useCategoryOptions,
  useSectorOptions,
  useStatusOptions,
} from '@/features/tickets/tickets-api';
import { useListParams } from '@/features/tickets/use-list-params';
import { ReportFilters } from './ReportFilters';
import { ReportTicketTable } from './ReportTicketTable';
import { useReportTickets, type ReportPeriod } from './reports-api';

const DEFAULTS = { page: '1', statusId: '', categoryId: '', sectorId: '' };

interface QueryTabProps {
  period: ReportPeriod;
}

/**
 * Tela 9, Consulta tab: the filtered listing of the manager. Filters and page live in the
 * address, changing a filter goes back to the first page and paging keeps the filters. There is
 * no export button in any state of this screen (BR5.1, BR5.2).
 */
export function QueryTab({ period }: QueryTabProps) {
  const { values, page, update, setPage, hasFilters } = useListParams(DEFAULTS);
  // Clearing empties this tab's own filters only: the period and the active tab live in the
  // same address and belong to the page above, so they are never wiped from here.
  const clearFilters = () => update({ statusId: '', categoryId: '', sectorId: '' });
  const statuses = useStatusOptions();
  const categories = useCategoryOptions();
  const sectors = useSectorOptions();
  const tickets = useReportTickets({
    period,
    page,
    statusId: values.statusId || undefined,
    categoryId: values.categoryId || undefined,
    sectorId: values.sectorId || undefined,
  });

  return (
    <div className="flex min-w-0 flex-col gap-4" data-testid="query-tab">
      <ReportFilters
        values={values}
        statuses={statuses.data?.items ?? []}
        categories={categories.data?.items ?? []}
        sectors={sectors.data?.items ?? []}
        onChange={update}
        onClear={clearFilters}
        hasFilters={hasFilters}
      />

      <ListState
        status={listStatusOf(tickets)}
        emptyMessage="Nenhum chamado para os filtros e o período selecionados."
        errorMessage={`Não foi possível carregar a consulta. ${messageForError(tickets.error)}`}
        onRetry={() => void tickets.refetch()}
      >
        {tickets.data && (
          <>
            <ReportTicketTable items={tickets.data.items} />
            <PaginationControls
              page={tickets.data.page}
              pageSize={tickets.data.pageSize}
              total={tickets.data.total}
              onPageChange={setPage}
              testIdPrefix="report-tickets"
            />
          </>
        )}
      </ListState>
    </div>
  );
}
