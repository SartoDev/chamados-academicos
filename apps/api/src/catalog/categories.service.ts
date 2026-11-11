import { Injectable } from '@nestjs/common';
import { DomainError } from '../common/errors/domain-error.js';
import { toSkipTake, type Page, type PageRequest } from '../common/pagination.js';
import { isUniqueConstraintViolation } from '../common/prisma/prisma-errors.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { isUuid } from '../common/uuid.js';
import type { Prisma } from '../generated/prisma/client.js';
import { assertActiveItem, catalogNameTaken } from './catalog-rules.js';
import { CATEGORY_WITH_SECTOR, toCategoryView } from './catalog.presenter.js';
import type { CategoryView } from './catalog.types.js';

export interface CategoryFilter {
  active?: boolean;
  sectorId?: string;
  /** BR4.4: true lists only categories offered for new tickets (category and sector active). */
  available?: boolean;
}

export interface CategoryChange {
  name?: string;
  sectorId?: string;
  active?: boolean;
}

function availabilityWhere(available: boolean | undefined): Prisma.CategoryWhereInput {
  if (available === undefined) {
    return {};
  }
  return available
    ? { active: true, sector: { active: true } }
    : { OR: [{ active: false }, { sector: { active: false } }] };
}

/** WF7 for categories (BR4.1 to BR4.4). A category is never deleted. */
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: CategoryFilter, page: PageRequest): Promise<Page<CategoryView>> {
    const where: Prisma.CategoryWhereInput = {
      AND: [
        { active: filter.active, sectorId: filter.sectorId },
        availabilityWhere(filter.available),
      ],
    };
    const [total, categories] = await Promise.all([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        include: CATEGORY_WITH_SECTOR,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...toSkipTake(page),
      }),
    ]);
    return {
      items: categories.map(toCategoryView),
      total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  /** BR4.2: the sector must exist and be active when the category is created. */
  async create(input: { name: string; sectorId: string }): Promise<CategoryView> {
    await this.assertActiveSector(input.sectorId);
    return this.writeUnique(() =>
      this.prisma.category.create({
        data: { name: input.name.trim(), sectorId: input.sectorId },
        include: CATEGORY_WITH_SECTOR,
      }),
    );
  }

  /** BR4.2: moving to another sector requires that sector to exist and be active. */
  async update(categoryId: string, change: CategoryChange): Promise<CategoryView> {
    const current = isUuid(categoryId)
      ? await this.prisma.category.findUnique({
          where: { id: categoryId },
          select: { sectorId: true },
        })
      : null;
    if (!current) {
      throw new DomainError('CATALOG_ITEM_NOT_FOUND', 'Category not found');
    }
    if (change.sectorId !== undefined && change.sectorId !== current.sectorId) {
      await this.assertActiveSector(change.sectorId);
    }
    return this.writeUnique(() =>
      this.prisma.category.update({
        where: { id: categoryId },
        data: { name: change.name?.trim(), sectorId: change.sectorId, active: change.active },
        include: CATEGORY_WITH_SECTOR,
      }),
    );
  }

  private async assertActiveSector(sectorId: string): Promise<void> {
    const sector = isUuid(sectorId)
      ? await this.prisma.sector.findUnique({ where: { id: sectorId }, select: { active: true } })
      : null;
    assertActiveItem(sector, 'Sector');
  }

  private async writeUnique(
    write: () => Promise<Parameters<typeof toCategoryView>[0]>,
  ): Promise<CategoryView> {
    try {
      return toCategoryView(await write());
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw catalogNameTaken();
      }
      throw error;
    }
  }
}
