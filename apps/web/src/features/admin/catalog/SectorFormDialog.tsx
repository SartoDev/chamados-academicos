import { z } from 'zod';
import type { Sector } from '@/app/api/types';
import { useCreateSector, useUpdateSector } from '../admin-api';
import { nameSchema } from './catalog-schemas';
import { NameFormDialog } from './NameFormDialog';

const sectorSchema = z.object({ name: nameSchema(80, 'nome') });

interface SectorFormDialogProps {
  sector?: Sector;
  onClose: () => void;
}

export function SectorFormDialog({ sector, onClose }: SectorFormDialogProps) {
  const createSector = useCreateSector();
  const updateSector = useUpdateSector();
  return (
    <NameFormDialog
      testId="sector-form-dialog"
      title={sector ? 'Editar setor' : 'Novo setor'}
      description="O nome não pode repetir o de outro setor, mesmo inativo."
      fieldLabel="nome"
      serverField="name"
      schema={sectorSchema}
      defaultValues={{ name: sector?.name ?? '' }}
      onClose={onClose}
      onSubmit={({ name }) =>
        sector
          ? updateSector.mutateAsync({ id: sector.id, input: { name: name.trim() } })
          : createSector.mutateAsync({ name: name.trim() })
      }
    />
  );
}
