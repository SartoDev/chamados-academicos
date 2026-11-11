import { Link } from 'react-router';
import type { TicketListItem } from '@/app/api/types';
import { DataTableContainer } from '@/app/components/form-parts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAbsoluteInstant, formatTimeAgo } from '../relative-time';
import { AssigneeCell, TicketStatusBadge } from './TicketBadges';

interface TicketListTableProps {
  items: readonly TicketListItem[];
  testIdPrefix: string;
  label: string;
  /** The general listing of the administrator also shows who opened the ticket. */
  showRequester?: boolean;
}

/**
 * The same list as a table from 768px and as cards below it, so the requester screens never
 * scroll sideways on a phone (BR9.2, AC5.4.2).
 */
export function TicketListTable({
  items,
  testIdPrefix,
  label,
  showRequester = false,
}: TicketListTableProps) {
  return (
    <>
      <div className="hidden md:block">
        <DataTableContainer label={label}>
          <Table data-testid={`${testIdPrefix}-table`}>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Número</TableHead>
                <TableHead scope="col">Título</TableHead>
                <TableHead scope="col">Categoria</TableHead>
                <TableHead scope="col">Setor</TableHead>
                {showRequester && <TableHead scope="col">Solicitante</TableHead>}
                <TableHead scope="col">Responsável</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Atualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((ticket) => (
                <TableRow key={ticket.id} data-testid={`${testIdPrefix}-row-${ticket.id}`}>
                  <TableCell>{ticket.reference}</TableCell>
                  <TableCell>
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      data-testid={`${testIdPrefix}-link-${ticket.id}`}
                    >
                      {ticket.title}
                    </Link>
                  </TableCell>
                  <TableCell>{ticket.category.name}</TableCell>
                  <TableCell>{ticket.sector.name}</TableCell>
                  {showRequester && <TableCell>{ticket.requester.name}</TableCell>}
                  <TableCell>
                    <AssigneeCell
                      assignee={ticket.assignee}
                      unavailable={ticket.assigneeUnavailable}
                    />
                  </TableCell>
                  <TableCell>
                    <TicketStatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell>
                    <span title={formatAbsoluteInstant(ticket.updatedAt)}>
                      {formatTimeAgo(ticket.updatedAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableContainer>
      </div>

      <ul className="flex flex-col gap-3 md:hidden" data-testid={`${testIdPrefix}-cards`}>
        {items.map((ticket) => (
          <li
            key={ticket.id}
            className="flex flex-col gap-2 rounded-md border p-3"
            data-testid={`${testIdPrefix}-card-${ticket.id}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">{ticket.reference}</span>
              <TicketStatusBadge status={ticket.status} />
            </div>
            <Link
              to={`/tickets/${ticket.id}`}
              className="font-medium underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              data-testid={`${testIdPrefix}-card-link-${ticket.id}`}
            >
              {ticket.title}
            </Link>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Categoria</dt>
              <dd>{ticket.category.name}</dd>
              <dt className="text-muted-foreground">Setor</dt>
              <dd>{ticket.sector.name}</dd>
              <dt className="text-muted-foreground">Atualizado</dt>
              <dd title={formatAbsoluteInstant(ticket.updatedAt)}>
                {formatTimeAgo(ticket.updatedAt)}
              </dd>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
