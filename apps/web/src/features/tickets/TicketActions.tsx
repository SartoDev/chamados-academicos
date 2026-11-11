import { useState } from 'react';
import type { CurrentUser, TicketDetail } from '@/app/api/types';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import { ConfirmStatusActionDialog } from './dialogs/ConfirmStatusActionDialog';
import { CONFIRMABLE_ACTIONS } from './dialogs/confirmable-actions';
import { AssignDialog } from './dialogs/AssignDialog';
import { PriorityDialog } from './dialogs/PriorityDialog';
import { TransferDialog } from './dialogs/TransferDialog';
import { availableTicketActions, hasAnyTicketAction } from './ticket-rules';
import { useTicketStatusAction } from './tickets-api';

interface TicketActionsProps {
  ticket: TicketDetail;
  user: CurrentUser;
}

/** BR9.4: only the actions the actor may run on this ticket appear (BR2.9, BR3.1 to BR3.8). */
export function TicketActions({ ticket, user }: TicketActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const statusAction = useTicketStatusAction();
  const actions = availableTicketActions(user, ticket);

  if (!hasAnyTicketAction(actions)) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="ticket-actions-empty">
        Este chamado está disponível apenas para leitura no seu perfil.
      </p>
    );
  }

  const assume = async () => {
    setError(null);
    try {
      await statusAction.mutateAsync({ ticketId: ticket.id, action: 'assume' });
    } catch (failure) {
      setError(messageForError(failure));
    }
  };

  return (
    <div className="flex flex-col gap-2" data-testid="ticket-actions">
      <div className="flex flex-wrap gap-2">
        {actions.assume && (
          <Button
            disabled={statusAction.isPending}
            onClick={() => void assume()}
            data-testid="ticket-actions-assume-button"
          >
            Assumir
          </Button>
        )}
        {actions.assign && <AssignDialog ticket={ticket} />}
        {actions.waitForRequester && (
          <ConfirmStatusActionDialog
            ticketId={ticket.id}
            action={CONFIRMABLE_ACTIONS['wait-for-requester']}
          />
        )}
        {actions.transfer && <TransferDialog ticket={ticket} />}
        {actions.changePriority && <PriorityDialog ticket={ticket} />}
        {actions.close && (
          <ConfirmStatusActionDialog ticketId={ticket.id} action={CONFIRMABLE_ACTIONS.close} />
        )}
        {actions.reopen && (
          <ConfirmStatusActionDialog ticketId={ticket.id} action={CONFIRMABLE_ACTIONS.reopen} />
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive" data-testid="ticket-actions-error">
          {error}
        </p>
      )}
    </div>
  );
}
