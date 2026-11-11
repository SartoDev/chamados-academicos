import { Injectable } from '@nestjs/common';
import { DomainError } from '../common/errors/domain-error.js';
import { toSkipTake, type Page, type PageRequest } from '../common/pagination.js';
import { acquireTransactionLock, LOCK_KEYS } from '../common/prisma/advisory-lock.js';
import { isUniqueConstraintViolation } from '../common/prisma/prisma-errors.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { isUuid } from '../common/uuid.js';
import type { Prisma } from '../generated/prisma/client.js';
import {
  catalogNameTaken,
  defaultPriorityRequired,
  evaluatePriorityChange,
} from './catalog-rules.js';
import { toPriorityView } from './catalog.presenter.js';
import type { PriorityView } from './catalog.types.js';

export interface PriorityChange {
  label?: string;
  isDefault?: boolean;
  active?: boolean;
}

async function clearOtherDefaults(tx: Prisma.TransactionClient, keepId?: string): Promise<void> {
  await tx.priority.updateMany({
    where: { isDefault: true, ...(keepId ? { id: { not: keepId } } : {}) },
    data: { isDefault: false },
  });
}

/**
 * WF7 for priorities (BR4.1, BR4.3, BR4.7). Moving the default mark happens in one
 * transaction serialized by an advisory lock, so there is always exactly one default.
 */
@Injectable()
export class PrioritiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: { active?: boolean }, page: PageRequest): Promise<Page<PriorityView>> {
    const where = { active: filter.active };
    const [total, priorities] = await Promise.all([
      this.prisma.priority.count({ where }),
      this.prisma.priority.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        ...toSkipTake(page),
      }),
    ]);
    return {
      items: priorities.map(toPriorityView),
      total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  async create(input: { label: string; isDefault?: boolean }): Promise<PriorityView> {
    return this.writeUnique(() =>
      this.prisma.$transaction(async (tx) => {
        await acquireTransactionLock(tx, LOCK_KEYS.DEFAULT_PRIORITY);
        if (input.isDefault) {
          await clearOtherDefaults(tx);
        }
        return tx.priority.create({
          data: { label: input.label.trim(), isDefault: input.isDefault ?? false },
        });
      }),
    );
  }

  async update(priorityId: string, change: PriorityChange): Promise<PriorityView> {
    if (!isUuid(priorityId)) {
      throw new DomainError('CATALOG_ITEM_NOT_FOUND', 'Priority not found');
    }
    return this.writeUnique(() =>
      this.prisma.$transaction(async (tx) => {
        await acquireTransactionLock(tx, LOCK_KEYS.DEFAULT_PRIORITY);
        const current = await tx.priority.findUnique({ where: { id: priorityId } });
        if (!current) {
          throw new DomainError('CATALOG_ITEM_NOT_FOUND', 'Priority not found');
        }
        const evaluation = evaluatePriorityChange(current, change);
        if (!evaluation.allowed) {
          throw defaultPriorityRequired();
        }
        if (evaluation.becomesDefault) {
          await clearOtherDefaults(tx, priorityId);
        }
        return tx.priority.update({
          where: { id: priorityId },
          data: { label: change.label?.trim(), isDefault: change.isDefault, active: change.active },
        });
      }),
    );
  }

  private async writeUnique(
    write: () => Promise<Parameters<typeof toPriorityView>[0]>,
  ): Promise<PriorityView> {
    try {
      return toPriorityView(await write());
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw catalogNameTaken();
      }
      throw error;
    }
  }
}
