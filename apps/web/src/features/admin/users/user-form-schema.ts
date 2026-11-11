import { z } from 'zod';
import type { Role } from '@/app/api/types';
import { isRole, requiresSector } from '@/app/roles';
import { passwordSchema } from '@/app/validation/password-policy';

export type UserFormMode = 'create' | 'edit';

/** Client-side mirror of BR3.1 to BR3.4; the server stays the authority. */
export function buildUserFormSchema(mode: UserFormMode) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'Informe o nome.')
        .max(120, 'O nome deve ter no máximo 120 caracteres.'),
      email:
        mode === 'create'
          ? z
              .string()
              .trim()
              .min(1, 'Informe o e-mail.')
              .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
              .email('Informe um e-mail válido.')
          : z.string(),
      role: z.string().refine(isRole, 'Escolha um perfil.'),
      sectorId: z.string(),
      password: mode === 'create' ? passwordSchema : z.string(),
    })
    .superRefine((values, context) => {
      // BR3.3: sector required only for agents and managers.
      if (requiresSector(values.role as Role) && !values.sectorId) {
        context.addIssue({
          code: 'custom',
          path: ['sectorId'],
          message: 'Escolha o setor do atendente ou gestor.',
        });
      }
    });
}

export type UserFormValues = z.input<ReturnType<typeof buildUserFormSchema>>;
