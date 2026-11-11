import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Role, SectorRef, User } from '@/app/api/types';
import { FormAlert, FormField, NativeSelect } from '@/app/components/form-parts';
import { applyServerError } from '@/app/components/server-errors';
import { requiresSector, ROLE_LABELS, ROLES } from '@/app/roles';
import { PASSWORD_RULES_TEXT } from '@/app/validation/password-policy';
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
import { OPTIONS_PAGE_SIZE, useCreateUser, useSectors, useUpdateUser } from '../admin-api';
import { buildUserFormSchema, type UserFormMode, type UserFormValues } from './user-form-schema';

const FIELDS = ['name', 'email', 'role', 'sectorId', 'password'] as const;

interface UserFormDialogProps {
  /** Present when editing; absent when creating. */
  user?: User;
  onClose: () => void;
  onSaved: (notice: string) => void;
}

/** Creates or edits a user (WF4, WF5). Only active sectors are offered (BR4.5). */
export function UserFormDialog({ user, onClose, onSaved }: UserFormDialogProps) {
  const mode: UserFormMode = user ? 'edit' : 'create';
  const schema = useMemo(() => buildUserFormSchema(mode), [mode]);
  const sectors = useSectors({ active: true, pageSize: OPTIONS_PAGE_SIZE });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      role: user?.role ?? '',
      sectorId: user?.sector?.id ?? '',
      password: '',
    },
  });
  const role = useWatch({ control, name: 'role' });
  const showSector = requiresSector(role as Role);

  const sectorOptions: SectorRef[] = [...(sectors.data?.items ?? [])];
  if (user?.sector && !sectorOptions.some((sector) => sector.id === user.sector?.id)) {
    sectorOptions.push({ id: user.sector.id, name: `${user.sector.name} (inativo)` });
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const roleValue = values.role as Role;
    const sectorId = requiresSector(roleValue) ? values.sectorId : undefined;
    try {
      if (user) {
        await updateUser.mutateAsync({
          id: user.id,
          input: { name: values.name.trim(), role: roleValue, sectorId: sectorId ?? null },
        });
        onSaved(`Usuário ${values.name.trim()} atualizado.`);
      } else {
        await createUser.mutateAsync({
          name: values.name.trim(),
          email: values.email.trim(),
          role: roleValue,
          password: values.password,
          sectorId,
        });
        onSaved(`Usuário ${values.name.trim()} criado.`);
      }
    } catch (error) {
      setFormError(applyServerError(error, setError, FIELDS));
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
      <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="user-form-dialog">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          <DialogDescription>
            {user
              ? 'Perfil, setor e situação novos valem na próxima requisição da pessoa.'
              : 'Informe os dados de acesso. A senha inicial deve ser entregue à pessoa.'}
          </DialogDescription>
        </DialogHeader>
        <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FormField id="user-form-name" label="Nome" error={errors.name?.message}>
            {(a11y) => (
              <Input
                {...a11y}
                autoComplete="off"
                data-testid="user-form-dialog-name-input"
                {...register('name')}
              />
            )}
          </FormField>

          {user ? (
            <p className="text-sm">
              <span className="font-medium">E-mail:</span> {user.email}
            </p>
          ) : (
            <FormField id="user-form-email" label="E-mail" error={errors.email?.message}>
              {(a11y) => (
                <Input
                  {...a11y}
                  type="email"
                  autoComplete="off"
                  data-testid="user-form-dialog-email-input"
                  {...register('email')}
                />
              )}
            </FormField>
          )}

          <FormField id="user-form-role" label="Perfil" error={errors.role?.message}>
            {(a11y) => (
              <NativeSelect
                {...a11y}
                data-testid="user-form-dialog-role-select"
                {...register('role')}
              >
                <option value="">Selecione</option>
                {ROLES.map((option) => (
                  <option key={option} value={option}>
                    {ROLE_LABELS[option]}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>

          {showSector && (
            <FormField
              id="user-form-sector"
              label="Setor"
              error={errors.sectorId?.message}
              hint="Obrigatório para Atendente e Gestor."
            >
              {(a11y) => (
                <NativeSelect
                  {...a11y}
                  data-testid="user-form-dialog-sector-select"
                  {...register('sectorId')}
                >
                  <option value="">Selecione</option>
                  {sectorOptions.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </FormField>
          )}

          {!user && (
            <FormField
              id="user-form-password"
              label="Senha inicial"
              error={errors.password?.message}
              hint={PASSWORD_RULES_TEXT}
            >
              {(a11y) => (
                <Input
                  {...a11y}
                  type="password"
                  autoComplete="new-password"
                  data-testid="user-form-dialog-password-input"
                  {...register('password')}
                />
              )}
            </FormField>
          )}

          <FormAlert message={formError} testId="user-form-dialog-error-alert" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="user-form-dialog-cancel-button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="user-form-dialog-submit-button"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
