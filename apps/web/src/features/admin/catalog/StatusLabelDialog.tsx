import { z } from 'zod';
import type { Status } from '@/app/api/types';
import { useUpdateStatus } from '../admin-api';
import { nameSchema } from './catalog-schemas';
import { NameFormDialog } from './NameFormDialog';

const statusSchema = z.object({ name: nameSchema(40, 'rótulo') });

interface StatusLabelDialogProps {
  status: Status;
  onClose: () => void;
}

/** BR4.6: only the label changes; the key is information, not a field. */
export function StatusLabelDialog({ status, onClose }: StatusLabelDialogProps) {
  const updateStatus = useUpdateStatus();
  return (
    <NameFormDialog
      testId="status-label-dialog"
      title="Editar rótulo do status"
      description={`Chave do status: ${status.key}. A chave não muda.`}
      fieldLabel="rótulo"
      serverField="label"
      schema={statusSchema}
      defaultValues={{ name: status.label }}
      onClose={onClose}
      onSubmit={({ name }) => updateStatus.mutateAsync({ id: status.id, label: name.trim() })}
    />
  );
}
