import { z } from 'zod';

/** Required catalog name or label with its maximum length (BR4.1). */
export function nameSchema(maxLength: number, fieldLabel: string) {
  return z
    .string()
    .trim()
    .min(1, `Informe o ${fieldLabel}.`)
    .max(maxLength, `O ${fieldLabel} deve ter no máximo ${maxLength} caracteres.`);
}
