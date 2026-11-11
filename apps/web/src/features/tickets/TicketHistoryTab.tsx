import { listStatusOf } from '@/app/components/list-status';
import { ListState } from '@/app/components/ListState';
import { messageForError } from '@/app/i18n/error-code-messages';
import { formatAbsoluteInstant, formatTimeAgo } from './relative-time';
import { HISTORY_FIELD_LABELS } from './ticket-labels';
import { useTicketHistory, useTicketPassages } from './tickets-api';

const EMPTY_VALUE = 'vazio';

/** BR5.1, BR5.2: every change in order, and every sector the ticket passed through. */
export function TicketHistoryTab({ ticketId }: { ticketId: string }) {
  const history = useTicketHistory(ticketId);
  const passages = useTicketPassages(ticketId);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2" aria-labelledby="ticket-history-heading">
        <h2 id="ticket-history-heading" className="text-lg font-semibold">
          Alterações
        </h2>
        <ListState
          status={listStatusOf(history)}
          emptyMessage="Este chamado ainda não teve alterações."
          errorMessage={`Não foi possível carregar o histórico. ${messageForError(history.error)}`}
          onRetry={() => void history.refetch()}
          skeletonRows={3}
        >
          <ol className="flex flex-col gap-3" data-testid="ticket-history-list">
            {(history.data?.items ?? []).map((entry) => (
              <li key={entry.id} className="rounded-md border p-3 text-sm">
                <p>
                  <span className="font-medium">{HISTORY_FIELD_LABELS[entry.field]}:</span>{' '}
                  {entry.previousValue ?? EMPTY_VALUE} para {entry.newValue ?? EMPTY_VALUE}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.author.name} ·{' '}
                  <span title={formatAbsoluteInstant(entry.occurredAt)}>
                    {formatTimeAgo(entry.occurredAt)}
                  </span>
                </p>
                {entry.justification && (
                  <p className="mt-1">
                    <span className="font-medium">Justificativa:</span> {entry.justification}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </ListState>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="ticket-passages-heading">
        <h2 id="ticket-passages-heading" className="text-lg font-semibold">
          Passagens por setor
        </h2>
        <ListState
          status={listStatusOf(passages)}
          emptyMessage="Nenhuma passagem registrada."
          errorMessage={`Não foi possível carregar as passagens. ${messageForError(passages.error)}`}
          onRetry={() => void passages.refetch()}
          skeletonRows={2}
        >
          <ol className="flex flex-col gap-3" data-testid="ticket-passages-list">
            {(passages.data?.items ?? []).map((passage) => (
              <li key={passage.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{passage.sector.name}</p>
                <p className="text-xs text-muted-foreground">
                  Entrada em {formatAbsoluteInstant(passage.enteredAt)}
                  {passage.leftAt
                    ? ` · saída em ${formatAbsoluteInstant(passage.leftAt)}`
                    : ' · setor atual'}
                </p>
                {passage.justification && (
                  <p className="mt-1">
                    <span className="font-medium">Justificativa:</span> {passage.justification}
                    {passage.transferredBy && ` (${passage.transferredBy.name})`}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </ListState>
      </section>
    </div>
  );
}
