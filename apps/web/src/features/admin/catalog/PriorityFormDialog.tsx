import { Controller } from 'react-hook-form';
import { z } from 'zod';
import type { Priority } from '@/app/api/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCreatePriority, useUpdatePriority } from '../admin-api';
import { nameSchema } from './catalog-schemas';
import { NameFormDialog } from './NameFormDialog';

const prioritySchema = z.object({ name: nameSchema(40, 'rótulo'), isDefault: z.boolean() });

type PriorityValues = z.infer<typeof prioritySchema>;

interface PriorityFormDialogProps {
  priority?: Priority;
  onClose: () => void;
}

/** BR4.7: marking a priority as default removes the mark from the previous one. */
export function PriorityFormDialog({ priority, onClose }: PriorityFormDialogProps) {
  const createPriority = useCreatePriority();
  const updatePriority = useUpdatePriority();
  return (
    <NameFormDialog<PriorityValues>
      testId="priority-form-dialog"
      title={priority ? 'Editar prioridade' : 'Nova prioridade'}
      description="Sempre existe exatamente uma prioridade padrão, e ela precisa estar ativa."
      fieldLabel="rótulo"
      serverField="label"
      schema={prioritySchema}
      defaultValues={{ name: priority?.label ?? '', isDefault: priority?.isDefault ?? false }}
      onClose={onClose}
      onSubmit={({ name, isDefault }) =>
        priority
          ? updatePriority.mutateAsync({
              id: priority.id,
              input: { label: name.trim(), isDefault },
            })
          : createPriority.mutateAsync({ label: name.trim(), isDefault })
      }
      extraFields={({ control }) => (
        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="priority-form-default"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
                data-testid="priority-form-dialog-default-checkbox"
              />
              <Label htmlFor="priority-form-default">Prioridade padrão</Label>
            </div>
          )}
        />
      )}
    />
  );
}
