import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { TicketDetail } from '@/app/api/types';
import { FormAlert, FormField, NativeSelect } from '@/app/components/form-parts';
import { applyServerError } from '@/app/components/server-errors';
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
import { JUSTIFICATION_MAX_LENGTH, transferSchema, type TransferValues } from '../ticket-schemas';
import { useActiveSectors, useTransferTicket } from '../tickets-api';

const FIELDS = ['targetSectorId', 'justification'] as const;

/** BR9.7: another active sector and a justification of 5 to 500 characters (BR3.3, AC2.4.1). */
export function TransferDialog({ ticket }: { ticket: TicketDetail }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const sectors = useActiveSectors();
  const transfer = useTransferTicket();
  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    mode: 'onBlur',
    defaultValues: { targetSectorId: '', justification: '' },
  });
  const justification = useWatch({ control, name: 'justification' }) ?? '';

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await transfer.mutateAsync({
        ticketId: ticket.id,
        targetSectorId: values.targetSectorId,
        justification: values.justification.trim(),
      });
      setOpen(false);
      reset();
    } catch (failure) {
      setFormError(applyServerError(failure, setError, FIELDS));
    }
  });

  const options = (sectors.data?.items ?? []).filter((sector) => sector.id !== ticket.sector.id);

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
        <Button variant="outline" data-testid="ticket-actions-transfer-button">
          Transferir
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="transfer-dialog">
        <DialogHeader>
          <DialogTitle>Transferir chamado</DialogTitle>
          <DialogDescription>
            O chamado sai de {ticket.sector.name}, perde o responsável e volta para Aberto na fila
            do setor de destino.
          </DialogDescription>
        </DialogHeader>
        <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FormField
            id="transfer-target-sector"
            label="Setor de destino"
            error={errors.targetSectorId?.message}
          >
            {(a11y) => (
              <NativeSelect
                {...a11y}
                data-testid="transfer-dialog-sector-select"
                {...register('targetSectorId')}
              >
                <option value="">Selecione</option>
                {options.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>

          <FormField
            id="transfer-justification"
            label="Justificativa"
            error={errors.justification?.message}
            hint={`${justification.length}/${JUSTIFICATION_MAX_LENGTH} caracteres`}
          >
            {(a11y) => (
              <textarea
                {...a11y}
                rows={4}
                className="w-full min-w-0 rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
                data-testid="transfer-dialog-justification-input"
                {...register('justification')}
              />
            )}
          </FormField>

          <FormAlert message={formError} testId="transfer-dialog-error-alert" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="transfer-dialog-cancel-button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="transfer-dialog-submit-button"
            >
              {isSubmitting ? 'Transferindo...' : 'Transferir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
