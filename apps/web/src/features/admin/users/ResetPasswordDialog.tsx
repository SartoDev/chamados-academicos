import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { User } from '@/app/api/types';
import { FormAlert, FormField } from '@/app/components/form-parts';
import { applyServerError } from '@/app/components/server-errors';
import { PASSWORD_RULES_TEXT, passwordSchema } from '@/app/validation/password-policy';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useResetPassword } from '../admin-api';

const resetPasswordSchema = z.object({ password: passwordSchema });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordDialogProps {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}

/** WF6: the new password replaces the previous one, with its rules visible before sending. */
export function ResetPasswordDialog({ user, onClose, onSaved }: ResetPasswordDialogProps) {
  const resetPassword = useResetPassword();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    defaultValues: { password: '' },
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    try {
      await resetPassword.mutateAsync({ id: user.id, password });
      onSaved();
    } catch (error) {
      setFormError(applyServerError(error, setError, ['password']));
    }
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent data-testid="reset-password-dialog">
        <DialogHeader>
          <DialogTitle>Redefinir senha de {user.name}</DialogTitle>
          <DialogDescription>
            A senha anterior deixa de funcionar assim que a nova for salva.
          </DialogDescription>
        </DialogHeader>
        <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FormField
            id="reset-password-new"
            label="Nova senha"
            error={errors.password?.message}
            hint={PASSWORD_RULES_TEXT}
          >
            {(a11y) => (
              <Input
                {...a11y}
                type="password"
                autoComplete="new-password"
                data-testid="reset-password-dialog-password-input"
                {...register('password')}
              />
            )}
          </FormField>
          <FormAlert message={formError} testId="reset-password-dialog-error-alert" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="reset-password-dialog-cancel-button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="reset-password-dialog-submit-button"
            >
              {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
