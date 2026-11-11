import type { Prisma } from '../../generated/prisma/client.js';

/** Keys of transaction-scoped PostgreSQL advisory locks used to serialize invariant checks. */
export const LOCK_KEYS = {
  INITIAL_LOAD: 71_001,
  ADMIN_PROTECTION: 71_002,
  DEFAULT_PRIORITY: 71_003,
} as const;

export type LockKey = (typeof LOCK_KEYS)[keyof typeof LOCK_KEYS];

/**
 * Blocks until the lock is granted; PostgreSQL releases it at commit or rollback. Two
 * transactions taking the same key run their check-and-write one after the other.
 */
export async function acquireTransactionLock(
  tx: Prisma.TransactionClient,
  key: LockKey,
): Promise<void> {
  await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(${key}::bigint)`;
}
