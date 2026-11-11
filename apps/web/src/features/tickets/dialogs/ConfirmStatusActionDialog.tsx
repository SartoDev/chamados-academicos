import { useState } from 'react';
import { messageForError } from '@/app/i18n/error-code-messages';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTicketStatusAction } from '../tickets-api';
import type { ConfirmableAction } from './confirmable-actions';

interface ConfirmStatusActionDialogProps {
  ticketId: string;
  action: ConfirmableAction;
}

export function ConfirmStatusActionDialog({ ticketId, action }: ConfirmStatusActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusAction = useTicketStatusAction();
  const testId = `ticket-actions-${action.action}`;

  const confirm = async () => {
    setError(null);
    try {
      await statusAction.mutateAsync({ ticketId, action: action.action });
      setOpen(false);
    } catch (failure) {
      // The dialog stays open with the translated message (frontend-components).
      setError(messageForError(failure));
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setError(null);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline" data-testid={`${testId}-button`}>
          {action.label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent data-testid={`${testId}-dialog`}>
        <AlertDialogHeader>
          <AlertDialogTitle>{action.title}</AlertDialogTitle>
          <AlertDialogDescription>{action.description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive" data-testid={`${testId}-error`}>
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={`${testId}-cancel-button`}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // The dialog closes only when the action succeeds.
              event.preventDefault();
              void confirm();
            }}
            data-testid={`${testId}-confirm-button`}
          >
            {statusAction.isPending ? 'Enviando...' : action.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
