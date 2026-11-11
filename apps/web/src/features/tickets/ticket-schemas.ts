import { z } from 'zod';

/** Client-side mirror of BR1.2 and BR3.3; the server stays the authority (Q3). */
export const TITLE_MIN_LENGTH = 5;
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 2000;
export const JUSTIFICATION_MIN_LENGTH = 5;
export const JUSTIFICATION_MAX_LENGTH = 500;

export const newTicketSchema = z.object({
  categoryId: z.string().min(1, 'Escolha a categoria do chamado.'),
  title: z
    .string()
    .trim()
    .min(1, 'Informe o título.')
    .min(TITLE_MIN_LENGTH, `O título deve ter pelo menos ${TITLE_MIN_LENGTH} caracteres.`)
    .max(TITLE_MAX_LENGTH, `O título deve ter no máximo ${TITLE_MAX_LENGTH} caracteres.`),
  description: z
    .string()
    .trim()
    .min(1, 'Informe a descrição.')
    .min(
      DESCRIPTION_MIN_LENGTH,
      `A descrição deve ter pelo menos ${DESCRIPTION_MIN_LENGTH} caracteres.`,
    )
    .max(
      DESCRIPTION_MAX_LENGTH,
      `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`,
    ),
  priorityId: z.string(),
});

export type NewTicketValues = z.input<typeof newTicketSchema>;

export const transferSchema = z.object({
  targetSectorId: z.string().min(1, 'Escolha o setor de destino.'),
  justification: z
    .string()
    .trim()
    .min(1, 'Informe a justificativa.')
    .min(
      JUSTIFICATION_MIN_LENGTH,
      `A justificativa deve ter pelo menos ${JUSTIFICATION_MIN_LENGTH} caracteres.`,
    )
    .max(
      JUSTIFICATION_MAX_LENGTH,
      `A justificativa deve ter no máximo ${JUSTIFICATION_MAX_LENGTH} caracteres.`,
    ),
});

export type TransferValues = z.input<typeof transferSchema>;
