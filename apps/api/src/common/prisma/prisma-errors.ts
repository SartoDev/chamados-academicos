/**
 * Prisma error detection by shape rather than by class import, so the check does not depend
 * on the generated client location. Prisma errors never reach the HTTP response (NFR3).
 */
const PRISMA_ERROR_NAMES = new Set([
  'PrismaClientKnownRequestError',
  'PrismaClientUnknownRequestError',
  'PrismaClientRustPanicError',
  'PrismaClientInitializationError',
  'PrismaClientValidationError',
]);

export function isPrismaError(error: unknown): error is Error & { code?: string } {
  return error instanceof Error && PRISMA_ERROR_NAMES.has(error.name);
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return isPrismaError(error) && error.code === code;
}

/** P2002: unique constraint violation. */
export function isUniqueConstraintViolation(error: unknown): boolean {
  return hasPrismaCode(error, 'P2002');
}

/** P2003: foreign key constraint violation. */
export function isForeignKeyViolation(error: unknown): boolean {
  return hasPrismaCode(error, 'P2003');
}
