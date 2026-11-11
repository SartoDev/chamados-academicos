import { useState } from 'react';
import { Link } from 'react-router';
import type { CurrentUser, TicketListItem } from '@/app/api/types';
import { DataTableContainer } from '@/app/components/form-parts';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AssigneeCell, TicketStatusBadge } from './components/TicketBadges';
import { formatAbsoluteInstant, formatTimeAgo } from './relative-time';
import { canAssume } from './ticket-rules';
import { useTicketStatusAction } from './tickets-api';

interface QueueTableProps {
  items: readonly TicketListItem[];
  user: CurrentUser;
}

/**
 * Tela 6: the working table of the sector. Horizontal scrolling stays inside the container on a
 * narrow screen (AC5.4.4) and "Assumir" is reachable by keyboard on every row (BR9.5).
 */
export function QueueTable({ items, user }: QueueTableProps) {
  const statusAction = useTicketStatusAction();
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const assume = async (ticketId: string) => {
    setBusyId(ticketId);
    setRowErrors((current) => {
      const next = { ...current };
      delete next[ticketId];
      return next;
    });
    try {
      await statusAction.mutateAsync({ ticketId, action: 'assume' });
    } catch (failure) {
      setRowErrors((current) => ({ ...current, [ticketId]: messageForError(failure) }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DataTableContainer label="Tabela da fila do setor">
      <Table data-testid="queue-table">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Número</TableHead>
            <TableHead scope="col">Título</TableHead>
            <TableHead scope="col">Solicitante</TableHead>
            <TableHead scope="col">Responsável</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Aberto há</TableHead>
            <TableHead scope="col">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((ticket) => (
            <TableRow key={ticket.id} data-testid={`queue-table-row-${ticket.id}`}>
              <TableCell>{ticket.reference}</TableCell>
              <TableCell>
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  data-testid={`queue-table-link-${ticket.id}`}
                >
                  {ticket.title}
                </Link>
              </TableCell>
              <TableCell>{ticket.requester.name}</TableCell>
              <TableCell>
                <AssigneeCell assignee={ticket.assignee} unavailable={ticket.assigneeUnavailable} />
              </TableCell>
              <TableCell>
                <TicketStatusBadge status={ticket.status} />
              </TableCell>
              <TableCell>
                <span title={formatAbsoluteInstant(ticket.openedAt)}>
                  {formatTimeAgo(ticket.openedAt)}
                </span>
              </TableCell>
              <TableCell>
                {canAssume(user, ticket) && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === ticket.id}
                    aria-label={`Assumir chamado ${ticket.reference}`}
                    onClick={() => void assume(ticket.id)}
                    data-testid={`queue-table-assume-button-${ticket.id}`}
                  >
                    Assumir
                  </Button>
                )}
                {rowErrors[ticket.id] && (
                  <p
                    role="alert"
                    className="mt-1 text-sm whitespace-normal text-destructive"
                    data-testid={`queue-table-row-error-${ticket.id}`}
                  >
                    {rowErrors[ticket.id]}
                  </p>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
