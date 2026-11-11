import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { FormAlert, FormField } from '@/app/components/form-parts';
import { applyServerError } from '@/app/components/server-errors';
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

interface NameFormDialogProps<T extends { name: string }> {
  testId: string;
  title: string;
  description: string;
  fieldLabel: string;
  schema: z.ZodType<T, T>;
  defaultValues: T;
  /** Server field name of the text field (`name` or `label`). */
  serverField: string;
  extraFields?: (form: UseFormReturn<T>) => ReactNode;
  onSubmit: (values: T) => Promise<unknown>;
  onClose: () => void;
}

/**
 * Shared create/edit dialog of the catalogs: one required text field plus optional extras,
 * validation on blur, server errors next to the field or above the buttons (BR4.1, BR7.4).
 */
export function NameFormDialog<T extends { name: string }>({
  testId,
  title,
  description,
  fieldLabel,
  schema,
  defaultValues,
  serverField,
  extraFields,
  onSubmit,
  onClose,
}: NameFormDialogProps<T>) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: defaultValues as never,
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const nameError = (errors as { name?: { message?: string } }).name?.message;

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      const mapped = applyServerError(
        error,
        (field, value) => setError((field === serverField ? 'name' : field) as never, value),
        [serverField] as never,
      );
      setFormError(mapped);
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
      <DialogContent data-testid={testId}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form noValidate className="flex flex-col gap-4" onSubmit={submit}>
          <FormField
            id={`${testId}-name`}
            label={fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1)}
            error={nameError}
          >
            {(a11y) => (
              <Input
                {...a11y}
                autoComplete="off"
                data-testid={`${testId}-name-input`}
                {...register('name' as never)}
              />
            )}
          </FormField>
          {extraFields?.(form)}
          <FormAlert message={formError} testId={`${testId}-error-alert`} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid={`${testId}-cancel-button`}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid={`${testId}-submit-button`}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
