import type { PriorityRef, TicketStatusRef, UserRef } from '@/app/api/types';

/**
 * Status and priority are shown as text, never as colour alone (AC5.3.4), and the badges use
 * only the tokens of the default Shadcn theme (AC5.3.6).
 */
export function TicketStatusBadge({ status }: { status: TicketStatusRef }) {
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
      data-testid="ticket-status-badge"
    >
      {status.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: PriorityRef }) {
  return (
    <span
      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
      data-testid="ticket-priority-badge"
    >
      Prioridade {priority.label}
    </span>
  );
}

interface AssigneeCellProps {
  assignee: UserRef | null;
  unavailable: boolean;
}

/** BR3.9: the mark of an unavailable assignee is written in text, next to the name. */
export function AssigneeCell({ assignee, unavailable }: AssigneeCellProps) {
  if (!assignee) {
    return (
      <span className="text-muted-foreground" data-testid="assignee-cell">
        Sem responsável
      </span>
    );
  }
  return (
    <span className="flex flex-col" data-testid="assignee-cell">
      <span>{assignee.name}</span>
      {unavailable && (
        <span className="text-xs text-muted-foreground">Responsável indisponível</span>
      )}
    </span>
  );
}
