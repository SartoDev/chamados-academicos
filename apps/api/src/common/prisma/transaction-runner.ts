import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

/** Client used by services: the ambient transaction when one is open, otherwise the pool. */
export type DatabaseClient = Prisma.TransactionClient;

/**
 * Interactive transaction limits. Waiting for a row lock held by a concurrent operation on the
 * same ticket counts against the timeout, so it is longer than Prisma's default of 5 seconds.
 */
const TRANSACTION_OPTIONS = { maxWait: 5_000, timeout: 15_000 } as const;

/**
 * Ambient transaction of a write operation (BR7.1, Q5, review finding R-01).
 *
 * `run` opens one interactive transaction and keeps its client in an AsyncLocalStorage, so every
 * service called while the operation runs, of any unit, reads and writes through `db()` inside
 * that same transaction. Nothing new travels in public signatures and no Prisma type crosses a
 * unit boundary. A `run` started while a transaction is already open joins it instead of
 * opening another one; a failure anywhere rolls back everything the operation wrote.
 */
@Injectable()
export class TransactionRunner {
  private readonly storage = new AsyncLocalStorage<DatabaseClient>();

  constructor(private readonly prisma: PrismaService) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.storage.getStore()) {
      return work();
    }
    return this.prisma.$transaction(
      (transaction) => this.storage.run(transaction, work),
      TRANSACTION_OPTIONS,
    );
  }

  /** The transactional client inside `run`, the regular client outside it. */
  db(): DatabaseClient {
    return this.storage.getStore() ?? this.prisma;
  }

  isInTransaction(): boolean {
    return this.storage.getStore() !== undefined;
  }
}
