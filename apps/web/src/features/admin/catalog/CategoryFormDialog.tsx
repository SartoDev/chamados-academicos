import { z } from 'zod';
import type { Category, SectorRef } from '@/app/api/types';
import { FormField, NativeSelect } from '@/app/components/form-parts';
import { OPTIONS_PAGE_SIZE, useCreateCategory, useSectors, useUpdateCategory } from '../admin-api';
import { nameSchema } from './catalog-schemas';
import { NameFormDialog } from './NameFormDialog';

const categorySchema = z.object({
  name: nameSchema(80, 'nome'),
  sectorId: z.string().min(1, 'Escolha o setor responsável.'),
});

type CategoryValues = z.infer<typeof categorySchema>;

interface CategoryFormDialogProps {
  category?: Category;
  onClose: () => void;
}

/** BR4.2: every category belongs to exactly one active sector. */
export function CategoryFormDialog({ category, onClose }: CategoryFormDialogProps) {
  const sectors = useSectors({ active: true, pageSize: OPTIONS_PAGE_SIZE });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const options: SectorRef[] = [...(sectors.data?.items ?? [])];
  if (category && !options.some((sector) => sector.id === category.sector.id)) {
    options.push({ id: category.sector.id, name: `${category.sector.name} (inativo)` });
  }

  return (
    <NameFormDialog<CategoryValues>
      testId="category-form-dialog"
      title={category ? 'Editar categoria' : 'Nova categoria'}
      description="A categoria define o setor que recebe os chamados abertos com ela."
      fieldLabel="nome"
      serverField="name"
      schema={categorySchema}
      defaultValues={{ name: category?.name ?? '', sectorId: category?.sector.id ?? '' }}
      onClose={onClose}
      onSubmit={({ name, sectorId }) =>
        category
          ? updateCategory.mutateAsync({ id: category.id, input: { name: name.trim(), sectorId } })
          : createCategory.mutateAsync({ name: name.trim(), sectorId })
      }
      extraFields={({ register, formState }) => (
        <FormField
          id="category-form-sector"
          label="Setor"
          error={formState.errors.sectorId?.message}
        >
          {(a11y) => (
            <NativeSelect
              {...a11y}
              data-testid="category-form-dialog-sector-select"
              {...register('sectorId')}
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
      )}
    />
  );
}
