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

export const CATALOG_DEACTIVATION_EFFECT =
  'O item deixa de ser oferecido para novos chamados e continua visível, com o mesmo nome, nos chamados existentes.';

export const USER_DEACTIVATION_EFFECT =
  'A pessoa não conseguirá mais entrar no sistema. O cadastro e tudo o que ela registrou continuam preservados.';

interface ConfirmDeactivateDialogProps {
  open: boolean;
  /** Written after "Desativar", e.g. "o setor Secretaria". */
  itemName: string;
  effect: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** BR4.8: explains the effect before deactivating; focus stays inside and Escape cancels. */
export function ConfirmDeactivateDialog({
  open,
  itemName,
  effect,
  onConfirm,
  onCancel,
}: ConfirmDeactivateDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent data-testid="confirm-deactivate-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Desativar {itemName}?</AlertDialogTitle>
          <AlertDialogDescription>{effect}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="confirm-deactivate-dialog-cancel-button">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            data-testid="confirm-deactivate-dialog-confirm-button"
          >
            Desativar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
