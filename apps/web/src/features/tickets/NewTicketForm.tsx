import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { FormAlert, FormField, NativeSelect } from '@/app/components/form-parts';
import { applyServerError } from '@/app/components/server-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  newTicketSchema,
  type NewTicketValues,
} from './ticket-schemas';
import { useActivePriorities, useAvailableCategories, useOpenTicket } from './tickets-api';

const FIELDS = ['categoryId', 'title', 'description', 'priorityId'] as const;

/**
 * Tela 4: the sector is shown from the category and never edited, the texts have a counter and
 * the priority starts on the default one (BR9.3, AC1.2.1, AC1.2.3).
 */
export function NewTicketForm() {
  const navigate = useNavigate();
  const categories = useAvailableCategories();
  const priorities = useActivePriorities();
  const openTicket = useOpenTicket();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewTicketValues>({
    resolver: zodResolver(newTicketSchema),
    mode: 'onBlur',
    defaultValues: { categoryId: '', title: '', description: '', priorityId: '' },
  });

  const categoryId = useWatch({ control, name: 'categoryId' });
  const title = useWatch({ control, name: 'title' }) ?? '';
  const description = useWatch({ control, name: 'description' }) ?? '';
  const priorityId = useWatch({ control, name: 'priorityId' });
  const chosenCategory = categories.data?.items.find((category) => category.id === categoryId);
  const defaultPriority = priorities.data?.items.find((priority) => priority.isDefault);

  useEffect(() => {
    if (!priorityId && defaultPriority) {
      setValue('priorityId', defaultPriority.id);
    }
  }, [priorityId, defaultPriority, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const ticket = await openTicket.mutateAsync({
        categoryId: values.categoryId,
        title: values.title.trim(),
        description: values.description.trim(),
        priorityId: values.priorityId || undefined,
      });
      navigate(`/tickets/${ticket.id}`, {
        state: { notice: `Chamado ${ticket.reference} aberto.` },
        replace: true,
      });
    } catch (error) {
      setFormError(applyServerError(error, setError, FIELDS));
      // A catalog item that changed underneath the form is reloaded (frontend-components).
      void categories.refetch();
      void priorities.refetch();
    }
  });

  return (
    <form noValidate className="flex max-w-2xl flex-col gap-4" onSubmit={onSubmit}>
      <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <FormField
              id="new-ticket-category"
              label="Categoria"
              error={errors.categoryId?.message}
            >
              {(a11y) => (
                <NativeSelect
                  {...a11y}
                  data-testid="new-ticket-form-category-select"
                  {...register('categoryId')}
                >
                  <option value="">Selecione</option>
                  {(categories.data?.items ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </FormField>
          </div>
          <div className="flex-1">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-ticket-sector">Setor responsável</Label>
              <Input
                id="new-ticket-sector"
                readOnly
                value={chosenCategory?.sector.name ?? ''}
                placeholder="Preenchido pela categoria"
                data-testid="new-ticket-form-sector-input"
              />
              <p className="text-xs text-muted-foreground">
                O setor vem da categoria escolhida e não é editável.
              </p>
            </div>
          </div>
        </div>

        <FormField
          id="new-ticket-title"
          label="Título"
          error={errors.title?.message}
          hint={`${title.length}/${TITLE_MAX_LENGTH} caracteres`}
        >
          {(a11y) => (
            <Input
              {...a11y}
              autoComplete="off"
              data-testid="new-ticket-form-title-input"
              {...register('title')}
            />
          )}
        </FormField>

        <FormField
          id="new-ticket-description"
          label="Descrição"
          error={errors.description?.message}
          hint={`${description.length}/${DESCRIPTION_MAX_LENGTH} caracteres`}
        >
          {(a11y) => (
            <textarea
              {...a11y}
              rows={6}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
              data-testid="new-ticket-form-description-input"
              {...register('description')}
            />
          )}
        </FormField>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Prioridade</legend>
          <div className="flex flex-wrap gap-4">
            {(priorities.data?.items ?? []).map((priority) => (
              <label key={priority.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value={priority.id}
                  data-testid={`new-ticket-form-priority-${priority.id}`}
                  {...register('priorityId')}
                />
                {priority.label}
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>

      <FormAlert message={formError} testId="new-ticket-form-error-alert" />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/tickets')}
          data-testid="new-ticket-form-cancel-button"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="new-ticket-form-submit-button">
          {isSubmitting ? 'Abrindo...' : 'Abrir Chamado'}
        </Button>
      </div>
    </form>
  );
}
