import { useState } from 'react';
import type { TicketDetail } from '@/app/api/types';
import { FormAlert } from '@/app/components/form-parts';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAssignableUsers, useAssignTicket } from '../tickets-api';

/** BR8.5, BR9.7: the manager chooses among the people who may receive tickets of the sector. */
export function AssignDialog({ ticket }: { ticket: TicketDetail }) {
  const [open, setOpen] = useState(false);
  const [chosenId, setChosenId] = useState(ticket.assignee?.id ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const assignable = useAssignableUsers(ticket.id);
  const assign = useAssignTicket();

  const submit = async () => {
    setFormError(null);
    try {
      await assign.mutateAsync({ ticketId: ticket.id, assigneeId: chosenId });
      setOpen(false);
    } catch (failure) {
      setFormError(messageForError(failure));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setFormError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="ticket-actions-assign-button">
          Atribuir
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="assign-dialog">
        <DialogHeader>
          <DialogTitle>Atribuir chamado</DialogTitle>
          <DialogDescription>
            Escolha quem vai atender o chamado em {ticket.sector.name}.
          </DialogDescription>
        </DialogHeader>

        {assignable.isPending && <p className="text-sm">Carregando...</p>}
        {assignable.isError && (
          <div role="alert" className="flex flex-col items-start gap-2">
            <p className="text-sm">Não foi possível carregar as pessoas do setor.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void assignable.refetch()}
              data-testid="assign-dialog-retry-button"
            >
              Tentar novamente
            </Button>
          </div>
        )}
        {assignable.data && (
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Pessoas do setor</legend>
            {assignable.data.items.length === 0 && (
              <p className="text-sm text-muted-foreground" data-testid="assign-dialog-empty">
                Nenhuma pessoa ativa do setor pode receber este chamado.
              </p>
            )}
            {assignable.data.items.map((user) => (
              <label key={user.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="assignee"
                  value={user.id}
                  checked={chosenId === user.id}
                  onChange={(event) => setChosenId(event.target.value)}
                  data-testid={`assign-dialog-option-${user.id}`}
                />
                <span>
                  {user.name}
                  {ticket.assignee?.id === user.id && (
                    <span className="text-muted-foreground"> (responsável atual)</span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <FormAlert message={formError} testId="assign-dialog-error-alert" />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            data-testid="assign-dialog-cancel-button"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!chosenId || assign.isPending}
            onClick={() => void submit()}
            data-testid="assign-dialog-submit-button"
          >
            {assign.isPending ? 'Atribuindo...' : 'Atribuir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
