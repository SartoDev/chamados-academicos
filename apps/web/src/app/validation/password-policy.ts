import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Shown next to every password field before submission (BR3.4). */
export const PASSWORD_RULES_TEXT = 'De 8 a 128 caracteres, com ao menos uma letra e um algarismo.';

const LETTER_PATTERN = /\p{L}/u;
const DIGIT_PATTERN = /[0-9]/;

/** Mirrors the server rule; the server stays the authority. Null when the password is valid. */
export function passwordPolicyMessage(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'A senha deve ter pelo menos 8 caracteres.';
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'A senha deve ter no máximo 128 caracteres.';
  }
  if (!LETTER_PATTERN.test(password)) {
    return 'A senha deve ter ao menos uma letra.';
  }
  if (!DIGIT_PATTERN.test(password)) {
    return 'A senha deve ter ao menos um algarismo.';
  }
  return null;
}

export const passwordSchema = z.string().superRefine((value, context) => {
  const message = passwordPolicyMessage(value);
  if (message) {
    context.addIssue({ code: 'custom', message });
  }
});
