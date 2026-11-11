import { Injectable } from '@nestjs/common';
import { DomainError } from '../common/errors/domain-error.js';
import { TransactionRunner, type DatabaseClient } from '../common/prisma/transaction-runner.js';
import { isUuid, uniqueUuids } from '../common/uuid.js';
import { assertActiveItem, isCategoryAvailable, isStatusKey } from './catalog-rules.js';
import type {
  CatalogItemRef,
  CatalogLabels,
  CategoryRef,
  FindLabelsInput,
  StatusRef,
} from './catalog.types.js';

function toItemRef(item: { id: string; name: string; active: boolean }): CatalogItemRef {
  return { id: item.id, name: item.name, active: item.active };
}

function toPriorityRef(priority: { id: string; label: string; active: boolean }): CatalogItemRef {
  return { id: priority.id, name: priority.label, active: priority.active };
}

/**
 * SVC-01 / SVC-04 public service of Catalog. Read-only, no route authorization of its own,
 * contract types only (BR8.9).
 */
@Injectable()
export class CatalogPublicService {
  constructor(private readonly transactions: TransactionRunner) {}

  /**
   * Reads go through the ambient transaction when the caller opened one, so a unit that reads
   * the catalog during a write operation sees that operation's own state (BR7.1 of U2).
   */
  private get db(): DatabaseClient {
    return this.transactions.db();
  }

  /** BR8.4: same condition as BR4.4 (category and sector active), with the derived sector. */
  async getActiveCategory(categoryId: string): Promise<CategoryRef> {
    const category = isUuid(categoryId)
      ? await this.db.category.findUnique({
          where: { id: categoryId },
          include: { sector: { select: { active: true } } },
        })
      : null;
    if (!category) {
      throw new DomainError('CATALOG_ITEM_NOT_FOUND', 'Category not found');
    }
    if (!isCategoryAvailable(category)) {
      throw new DomainError('CATALOG_ITEM_INACTIVE', 'Category or its sector is inactive');
    }
    return { id: category.id, name: category.name, active: true, sectorId: category.sectorId };
  }

  /** BR8.5. */
  async getActiveSector(sectorId: string): Promise<CatalogItemRef> {
    const sector = isUuid(sectorId)
      ? await this.db.sector.findUnique({ where: { id: sectorId } })
      : null;
    return toItemRef(assertActiveItem(sector, 'Sector'));
  }

  /** BR8.5. */
  async getActivePriority(priorityId: string): Promise<CatalogItemRef> {
    const priority = isUuid(priorityId)
      ? await this.db.priority.findUnique({ where: { id: priorityId } })
      : null;
    return toPriorityRef(assertActiveItem(priority, 'Priority'));
  }

  /** BR8.6: never picks an arbitrary priority; a broken BR4.7 invariant is an internal error. */
  async getDefaultPriority(): Promise<CatalogItemRef> {
    const defaults = await this.db.priority.findMany({ where: { isDefault: true }, take: 2 });
    const [priority] = defaults;
    if (defaults.length !== 1 || !priority || !priority.active) {
      throw new DomainError('INTERNAL_ERROR', 'Default priority invariant (BR4.7) is broken');
    }
    return toPriorityRef(priority);
  }

  /** BR8.7. */
  async getStatusByKey(key: string): Promise<StatusRef> {
    const status = isStatusKey(key) ? await this.db.status.findUnique({ where: { key } }) : null;
    if (!status) {
      throw new DomainError('CATALOG_ITEM_NOT_FOUND', 'Status not found');
    }
    return { id: status.id, key: status.key, name: status.label };
  }

  /** BR8.8: inactive items included, unknown identifiers omitted, statuses without `active`. */
  async findLabels(input: FindLabelsInput): Promise<CatalogLabels> {
    const [categories, sectors, statuses, priorities] = await Promise.all([
      this.findByIds(input.categoryIds, (ids) =>
        this.db.category.findMany({ where: { id: { in: ids } } }),
      ),
      this.findByIds(input.sectorIds, (ids) =>
        this.db.sector.findMany({ where: { id: { in: ids } } }),
      ),
      this.findByIds(input.statusIds, (ids) =>
        this.db.status.findMany({ where: { id: { in: ids } } }),
      ),
      this.findByIds(input.priorityIds, (ids) =>
        this.db.priority.findMany({ where: { id: { in: ids } } }),
      ),
    ]);
    return {
      categories: categories.map(toItemRef),
      sectors: sectors.map(toItemRef),
      statuses: statuses.map((status) => ({ id: status.id, name: status.label })),
      priorities: priorities.map(toPriorityRef),
    };
  }

  private async findByIds<T>(
    ids: string[] | undefined,
    query: (validIds: string[]) => Promise<T[]>,
  ): Promise<T[]> {
    const validIds = uniqueUuids(ids);
    return validIds.length === 0 ? [] : query(validIds);
  }
}
