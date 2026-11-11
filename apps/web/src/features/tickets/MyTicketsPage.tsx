import { Link } from 'react-router';
import { listStatusOf } from '@/app/components/list-status';
import { ListState } from '@/app/components/ListState';
import { PaginationControls } from '@/app/components/PaginationControls';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
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

/** Tela 3: the tickets the requester opened, with filters, ordering and paging (US1.3). */
export function MyTicketsPage() {
  const { values, page, update, clear, setPage, hasFilters } = useListParams(DEFAULTS);
  const sortOption = sortOptionOf(values.sort);
  const statuses = useStatusOptions();
  const categories = useCategoryOptions();
  const sectors = useSectorOptions();
  const tickets = useTickets({
    view: 'requested',
    page,
    statusId: values.statusId || undefined,
    categoryId: values.categoryId || undefined,
    sectorId: values.sectorId || undefined,
    sort: sortOption.sort,
    order: sortOption.order,
  });
  const status = listStatusOf(tickets);

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Meus Chamados</h1>
        <Button asChild data-testid="my-tickets-new-button">
          <Link to="/tickets/new">Novo Chamado</Link>
        </Button>
      </div>

      <TicketFilters
        testIdPrefix="my-tickets"
        values={values}
        sortValue={values.sort}
        statuses={statuses.data?.items ?? []}
        categories={categories.data?.items ?? []}
        sectors={sectors.data?.items ?? []}
        onChange={update}
        onClear={clear}
        hasFilters={hasFilters}
      />

      {status === 'empty' ? (
        <div
          className="flex flex-col items-start gap-3 rounded-md border p-4"
          data-testid="my-tickets-empty"
        >
          {hasFilters ? (
            <>
              <p className="text-sm">Nenhum chamado corresponde aos filtros.</p>
              <Button variant="outline" onClick={clear} data-testid="my-tickets-empty-clear-button">
                Limpar filtros
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm">Você ainda não abriu nenhum chamado.</p>
              <Button asChild data-testid="my-tickets-empty-new-button">
                <Link to="/tickets/new">Abrir meu primeiro chamado</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <ListState
          status={status}
          emptyMessage=""
          errorMessage={`Não foi possível carregar seus chamados. ${messageForError(tickets.error)}`}
          onRetry={() => void tickets.refetch()}
        >
          {tickets.data && (
            <>
              <TicketListTable
                items={tickets.data.items}
                testIdPrefix="my-tickets"
                label="Tabela dos meus chamados"
              />
              <PaginationControls
                page={tickets.data.page}
                pageSize={tickets.data.pageSize}
                total={tickets.data.total}
                onPageChange={setPage}
                testIdPrefix="my-tickets"
              />
            </>
          )}
        </ListState>
      )}
    </section>
  );
}
