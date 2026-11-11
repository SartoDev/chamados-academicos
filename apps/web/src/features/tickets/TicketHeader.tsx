import type { TicketDetail } from '@/app/api/types';
import { AssigneeCell, PriorityBadge, TicketStatusBadge } from './components/TicketBadges';
import { formatAbsoluteInstant } from './relative-time';

/** Tela 5: number, title, status and priority in text, plus the metadata line (BR9.4, AC5.3.4). */
export function TicketHeader({ ticket }: { ticket: TicketDetail }) {
  return (
    <header className="flex flex-col gap-3" data-testid="ticket-header">
      <h1 className="text-2xl font-semibold">
        {ticket.reference} {ticket.title}
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        <TicketStatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
        <dt className="font-medium">Setor</dt>
        <dd>{ticket.sector.name}</dd>
        <dt className="font-medium">Categoria</dt>
        <dd>{ticket.category.name}</dd>
        <dt className="font-medium">Solicitante</dt>
        <dd>{ticket.requester.name}</dd>
        <dt className="font-medium">Responsável</dt>
        <dd>
          <AssigneeCell assignee={ticket.assignee} unavailable={ticket.assigneeUnavailable} />
        </dd>
        <dt className="font-medium">Aberto em</dt>
        <dd>{formatAbsoluteInstant(ticket.openedAt)}</dd>
        <dt className="font-medium">Última atualização</dt>
        <dd>{formatAbsoluteInstant(ticket.updatedAt)}</dd>
        {ticket.closedAt && (
          <>
            <dt className="font-medium">Encerrado em</dt>
            <dd>{formatAbsoluteInstant(ticket.closedAt)}</dd>
          </>
        )}
      </dl>
    </header>
  );
}
