import { Injectable } from '@nestjs/common';
import { DomainError } from '../common/errors/domain-error.js';
import { toSkipTake, type Page, type PageRequest } from '../common/pagination.js';
import { isUniqueConstraintViolation } from '../common/prisma/prisma-errors.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { isUuid } from '../common/uuid.js';
import { catalogNameTaken } from './catalog-rules.js';
import { toSectorView } from './catalog.presenter.js';
import type { SectorView } from './catalog.types.js';

export interface SectorChange {
  name?: string;
  active?: boolean;
}

function sectorNotFound(): DomainError {
  return new DomainError('CATALOG_ITEM_NOT_FOUND', 'Sector not found');
}

/** WF7 for sectors (BR4.1, BR4.3, BR4.5). A sector is never deleted. */
@Injectable()
export class SectorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: { active?: boolean }, page: PageRequest): Promise<Page<SectorView>> {
    const where = { active: filter.active };
    const [total, sectors] = await Promise.all([
      this.prisma.sector.count({ where }),
      this.prisma.sector.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...toSkipTake(page),
      }),
    ]);
    return { items: sectors.map(toSectorView), total, page: page.page, pageSize: page.pageSize };
  }

  async create(input: { name: string }): Promise<SectorView> {
    return this.writeUnique(() => this.prisma.sector.create({ data: { name: input.name.trim() } }));
  }

  /** Deactivation keeps categories as they are; they leave the options through BR4.4. */
  async update(sectorId: string, change: SectorChange): Promise<SectorView> {
    const exists =
      isUuid(sectorId) &&
      (await this.prisma.sector.findUnique({ where: { id: sectorId }, select: { id: true } }));
    if (!exists) {
      throw sectorNotFound();
    }
    return this.writeUnique(() =>
      this.prisma.sector.update({
        where: { id: sectorId },
        data: { name: change.name?.trim(), active: change.active },
      }),
    );
  }

  /** BR4.1: uniqueness ignoring case and counting inactive items is enforced by the database. */
  private async writeUnique(
    write: () => Promise<Parameters<typeof toSectorView>[0]>,
  ): Promise<SectorView> {
    try {
      return toSectorView(await write());
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw catalogNameTaken();
      }
      throw error;
    }
  }
}
