import { Link } from 'react-router';
import type { ReportTicket } from '@/app/api/types';
import { DataTableContainer } from '@/app/components/form-parts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAbsoluteInstant, formatTimeAgo } from '@/features/tickets/relative-time';

interface ReportTicketTableProps {
  items: readonly ReportTicket[];
}

/**
 * Rows of the filtered listing, composed from the same pieces the ticket lists of U2 use: the
 * scrolling container, the table of the theme and the instant formatting. There is no duration
 * column and no export action in any state of this screen (BR5.1, BR5.2).
 */
export function ReportTicketTable({ items }: ReportTicketTableProps) {
  return (
    <>
      <div className="hidden md:block">
        <DataTableContainer label="Chamados do período">
          <Table data-testid="report-tickets-table">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Número</TableHead>
                <TableHead scope="col">Título</TableHead>
                <TableHead scope="col">Categoria</TableHead>
                <TableHead scope="col">Setor</TableHead>
                <TableHead scope="col">Responsável</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Aberto em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((ticket) => (
                <TableRow key={ticket.id} data-testid={`report-tickets-row-${ticket.id}`}>
                  <TableCell>{ticket.reference}</TableCell>
                  <TableCell>
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      data-testid={`report-tickets-link-${ticket.id}`}
                    >
                      {ticket.title}
                    </Link>
                  </TableCell>
                  <TableCell>{ticket.category.name}</TableCell>
                  <TableCell>{ticket.sector.name}</TableCell>
                  <TableCell>
                    {ticket.assignee ? (
                      ticket.assignee.name
                    ) : (
                      <span className="text-muted-foreground">Sem responsável</span>
                    )}
                  </TableCell>
                  <TableCell>{ticket.status.name}</TableCell>
                  <TableCell>
                    <span title={formatTimeAgo(ticket.openedAt)}>
                      {formatAbsoluteInstant(ticket.openedAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableContainer>
      </div>

      <ul className="flex flex-col gap-3 md:hidden" data-testid="report-tickets-cards">
        {items.map((ticket) => (
          <li
            key={ticket.id}
            className="flex flex-col gap-2 rounded-md border p-3"
            data-testid={`report-tickets-card-${ticket.id}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">{ticket.reference}</span>
              <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
                {ticket.status.name}
              </span>
            </div>
            <Link
              to={`/tickets/${ticket.id}`}
              className="font-medium underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              data-testid={`report-tickets-card-link-${ticket.id}`}
            >
              {ticket.title}
            </Link>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Categoria</dt>
              <dd>{ticket.category.name}</dd>
              <dt className="text-muted-foreground">Setor</dt>
              <dd>{ticket.sector.name}</dd>
              <dt className="text-muted-foreground">Aberto em</dt>
              <dd>{formatAbsoluteInstant(ticket.openedAt)}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
