import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { Clock } from '../common/clock.js';
import { acquireTransactionLock, LOCK_KEYS } from '../common/prisma/advisory-lock.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { PasswordHasher } from '../common/security/password-hasher.js';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import type { Prisma, StatusKey } from '../generated/prisma/client.js';

export const INITIAL_STATUSES: ReadonlyArray<{ key: StatusKey; label: string }> = [
  { key: 'OPEN', label: 'Aberto' },
  { key: 'IN_ANALYSIS', label: 'Em análise' },
  { key: 'WAITING_REQUESTER', label: 'Aguardando solicitante' },
  { key: 'CLOSED', label: 'Encerrado' },
];

export const INITIAL_PRIORITIES: ReadonlyArray<{ label: string; isDefault: boolean }> = [
  { label: 'Baixa', isDefault: false },
  { label: 'Normal', isDefault: true },
  { label: 'Alta', isDefault: false },
];

export const INITIAL_ADMIN_NAME = 'Administrador';

/** The initial load cannot complete; the application must not start (BR5.2). */
export class InitialLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InitialLoadError';
  }
}

/**
 * Idempotent initial load, run when the application starts (WF9). Running it again never
 * duplicates rows nor overwrites labels edited by the administrator.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.run();
  }

  async run(): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await acquireTransactionLock(tx, LOCK_KEYS.INITIAL_LOAD);
      await this.ensureStatuses(tx);
      await this.ensurePriorities(tx);
      await this.ensureInitialAdmin(tx);
    });
  }

  /** BR5.1: one status per key; an existing status keeps its label. */
  private async ensureStatuses(tx: Prisma.TransactionClient): Promise<void> {
    const existing = await tx.status.findMany({ select: { key: true } });
    const existingKeys = new Set(existing.map((status) => status.key));
    const missing = INITIAL_STATUSES.filter((status) => !existingKeys.has(status.key));
    for (const status of missing) {
      await tx.status.create({ data: status });
    }
  }

  /** BR5.1: the three initial priorities only when no priority exists at all. */
  private async ensurePriorities(tx: Prisma.TransactionClient): Promise<void> {
    if ((await tx.priority.count()) > 0) {
      return;
    }
    // Distinct creation instants keep the initial order (Baixa, Normal, Alta) stable.
    const baseTime = this.clock.now().getTime();
    for (const [index, priority] of INITIAL_PRIORITIES.entries()) {
      await tx.priority.create({ data: { ...priority, createdAt: new Date(baseTime + index) } });
    }
  }

  /** BR5.2: create the configured administrator only when there is no active ADMIN. */
  private async ensureInitialAdmin(tx: Prisma.TransactionClient): Promise<void> {
    const activeAdmin = await tx.user.findFirst({
      where: { role: 'ADMIN', active: true },
      select: { id: true },
    });
    if (activeAdmin) {
      return;
    }
    const { email, password } = this.config.initialAdmin;
    const emailOwner = await tx.user.findUnique({ where: { email }, select: { id: true } });
    if (emailOwner) {
      throw new InitialLoadError(
        'There is no active administrator and INITIAL_ADMIN_EMAIL already belongs to another user; ' +
          'the initial administrator was not created.',
      );
    }
    const passwordHash = await this.hasher.hash(password);
    await tx.user.create({
      data: { name: INITIAL_ADMIN_NAME, email, passwordHash, role: 'ADMIN', active: true },
    });
    this.logger.log('Initial administrator created from INITIAL_ADMIN_EMAIL.');
  }
}
