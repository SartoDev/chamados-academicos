import { z } from 'zod';
import { MESSAGE_BODY_MAX_LENGTH, MESSAGE_BODY_MIN_LENGTH } from './conversation-rules';

/** Client-side mirror of BR2.1: required, 1 to 2000 characters once trimmed, plain text. */
export const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(MESSAGE_BODY_MIN_LENGTH, 'Escreva a mensagem.')
    .max(
      MESSAGE_BODY_MAX_LENGTH,
      `A mensagem deve ter no máximo ${MESSAGE_BODY_MAX_LENGTH} caracteres.`,
    ),
});

export type MessageValues = z.input<typeof messageSchema>;
