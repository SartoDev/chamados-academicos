import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatScore } from './rating-labels';

export const RATING_IS_FINAL_WARNING =
  'A avaliação é definitiva: depois de enviada, ela não poderá ser alterada nem apagada.';

interface ConfirmRatingDialogProps {
  open: boolean;
  /** The score about to be sent, written out with its label so nothing is confirmed blind. */
  score: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/** BR5.3: says the rating is final before it is sent; focus stays inside and Escape cancels. */
export function ConfirmRatingDialog({
  open,
  score,
  onConfirm,
  onCancel,
}: ConfirmRatingDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent data-testid="confirm-rating-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Enviar a avaliação {formatScore(score)}?</AlertDialogTitle>
          <AlertDialogDescription>{RATING_IS_FINAL_WARNING}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="confirm-rating-dialog-cancel-button">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} data-testid="confirm-rating-dialog-confirm-button">
            Enviar avaliação
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
