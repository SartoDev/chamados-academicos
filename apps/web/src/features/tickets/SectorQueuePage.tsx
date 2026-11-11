import { ApiError } from '@/app/api/api-client';
import type { QueueSlice } from '@/app/api/types';
import { listStatusOf } from '@/app/components/list-status';
import { ListState } from '@/app/components/ListState';
import { PaginationControls } from '@/app/components/PaginationControls';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from '@/features/auth/use-session';
import { QueueTable } from './QueueTable';
import { TicketFilters } from './components/TicketFilters';
import { QUEUE_EMPTY_MESSAGES, QUEUE_SLICE_LABELS, QUEUE_SLICES } from './ticket-labels';
import { useCategoryOptions, useStatusOptions, useTickets } from './tickets-api';
import { useListParams } from './use-list-params';

const DEFAULTS = { page: '1', queue: 'unassigned', statusId: '', categoryId: '', sectorId: '' };

function toQueueSlice(value: string): QueueSlice {
  return (QUEUE_SLICES as readonly string[]).includes(value) ? (value as QueueSlice) : 'unassigned';
}

/** Tela 6: the queue of the sector, with its four slices and the filters (US2.1, BR9.5). */
export function SectorQueuePage() {
  const { user } = useSession();
  const { values, page, update, clear, setPage, hasFilters } = useListParams(DEFAULTS);
  const slice = toQueueSlice(values.queue);
  const statuses = useStatusOptions();
  const categories = useCategoryOptions();
  const tickets = useTickets({
    view: 'queue',
    queue: slice,
    page,
    statusId: values.statusId || undefined,
    categoryId: values.categoryId || undefined,
  });

  const noSector =
    tickets.error instanceof ApiError && tickets.error.code === 'TICKET_QUEUE_NO_SECTOR';

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        Fila do Setor{user?.sector ? ` — ${user.sector.name}` : ''}
      </h1>

      {noSector ? (
        <div role="alert" className="rounded-md border p-4 text-sm" data-testid="queue-no-sector">
          {messageForError(tickets.error)}
        </div>
      ) : (
        <>
          <Tabs
            value={slice}
            onValueChange={(value) => update({ queue: value })}
            className="min-w-0"
          >
            <div className="max-w-full overflow-x-auto">
              <TabsList aria-label="Recortes da fila">
                {QUEUE_SLICES.map((option) => (
                  <TabsTrigger
                    key={option}
                    value={option}
                    data-testid={`queue-slice-${option}-tab`}
                  >
                    {QUEUE_SLICE_LABELS[option]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          <TicketFilters
            testIdPrefix="queue"
            values={values}
            statuses={statuses.data?.items ?? []}
            categories={categories.data?.items ?? []}
            onChange={update}
            onClear={clear}
            hasFilters={hasFilters}
          />

          <ListState
            status={listStatusOf(tickets)}
            emptyMessage={QUEUE_EMPTY_MESSAGES[slice]}
            errorMessage={`Não foi possível carregar a fila do setor. ${messageForError(tickets.error)}`}
            onRetry={() => void tickets.refetch()}
          >
            {tickets.data && user && (
              <>
                <QueueTable items={tickets.data.items} user={user} />
                <PaginationControls
                  page={tickets.data.page}
                  pageSize={tickets.data.pageSize}
                  total={tickets.data.total}
                  onPageChange={setPage}
                  testIdPrefix="queue"
                />
              </>
            )}
          </ListState>
        </>
      )}
    </section>
  );
}
