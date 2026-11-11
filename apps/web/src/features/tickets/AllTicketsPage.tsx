import { listStatusOf } from '@/app/components/list-status';
import { ListState } from '@/app/components/ListState';
import { PaginationControls } from '@/app/components/PaginationControls';
import { messageForError } from '@/app/i18n/error-code-messages';
import { TicketFilters } from './components/TicketFilters';
import { TicketListTable } from './components/TicketListTable';
import { DEFAULT_SORT_OPTION, sortOptionOf } from './ticket-labels';
import { useCategoryOptions, useSectorOptions, useStatusOptions, useTickets } from './tickets-api';
import { useListParams } from './use-list-params';

const DEFAULTS = {
  page: '1',
  statusId: '',
  categoryId: '',
  sectorId: '',
  sort: DEFAULT_SORT_OPTION.value,
};

/** General listing of the administrator, read-only (BR2.3, Q4). */
export function AllTicketsPage() {
  const { values, page, update, clear, setPage, hasFilters } = useListParams(DEFAULTS);
  const sortOption = sortOptionOf(values.sort);
  const statuses = useStatusOptions();
  const categories = useCategoryOptions();
  const sectors = useSectorOptions();
  const tickets = useTickets({
    view: 'all',
    page,
    statusId: values.statusId || undefined,
    categoryId: values.categoryId || undefined,
    sectorId: values.sectorId || undefined,
    sort: sortOption.sort,
    order: sortOption.order,
  });

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <h1 className="text-2xl font-semibold">Chamados</h1>
      <p className="text-sm text-muted-foreground">
        Visão geral de todos os chamados, somente para leitura.
      </p>

      <TicketFilters
        testIdPrefix="all-tickets"
        values={values}
        sortValue={values.sort}
        statuses={statuses.data?.items ?? []}
        categories={categories.data?.items ?? []}
        sectors={sectors.data?.items ?? []}
        onChange={update}
        onClear={clear}
        hasFilters={hasFilters}
      />

      <ListState
        status={listStatusOf(tickets)}
        emptyMessage="Nenhum chamado corresponde aos filtros escolhidos."
        errorMessage={`Não foi possível carregar os chamados. ${messageForError(tickets.error)}`}
        onRetry={() => void tickets.refetch()}
      >
        {tickets.data && (
          <>
            <TicketListTable
              items={tickets.data.items}
              testIdPrefix="all-tickets"
              label="Tabela de todos os chamados"
              showRequester
            />
            <PaginationControls
              page={tickets.data.page}
              pageSize={tickets.data.pageSize}
              total={tickets.data.total}
              onPageChange={setPage}
              testIdPrefix="all-tickets"
            />
          </>
        )}
      </ListState>
    </section>
  );
}
