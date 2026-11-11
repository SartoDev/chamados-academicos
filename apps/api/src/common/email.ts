/** BR1.1: e-mails are compared and stored in lowercase, without surrounding spaces. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailLike(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}
