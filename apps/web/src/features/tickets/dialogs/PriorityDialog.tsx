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
import { useActivePriorities, useChangeTicketPriority } from '../tickets-api';

/** BR3.7: an active priority, with the current one already selected (BR9.7). */
export function PriorityDialog({ ticket }: { ticket: TicketDetail }) {
  const [open, setOpen] = useState(false);
  const [chosenId, setChosenId] = useState(ticket.priority.id);
  const [formError, setFormError] = useState<string | null>(null);
  const priorities = useActivePriorities();
  const changePriority = useChangeTicketPriority();

  const submit = async () => {
    setFormError(null);
    try {
      await changePriority.mutateAsync({ ticketId: ticket.id, priorityId: chosenId });
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
        <Button variant="outline" data-testid="ticket-actions-priority-button">
          Alterar prioridade
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="priority-dialog">
        <DialogHeader>
          <DialogTitle>Alterar prioridade</DialogTitle>
          <DialogDescription>
            A mudança fica registrada no histórico do chamado, com o seu nome.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Prioridades ativas</legend>
          {(priorities.data?.items ?? []).map((priority) => (
            <label key={priority.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="priority"
                value={priority.id}
                checked={chosenId === priority.id}
                onChange={(event) => setChosenId(event.target.value)}
                data-testid={`priority-dialog-option-${priority.id}`}
              />
              <span>
                {priority.label}
                {ticket.priority.id === priority.id && (
                  <span className="text-muted-foreground"> (atual)</span>
                )}
              </span>
            </label>
          ))}
        </fieldset>

        <FormAlert message={formError} testId="priority-dialog-error-alert" />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            data-testid="priority-dialog-cancel-button"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={changePriority.isPending}
            onClick={() => void submit()}
            data-testid="priority-dialog-submit-button"
          >
            {changePriority.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
