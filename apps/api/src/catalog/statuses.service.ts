import { Injectable } from '@nestjs/common';
import { DomainError } from '../common/errors/domain-error.js';
import { FIRST_PAGE, type Page } from '../common/pagination.js';
import { isUniqueConstraintViolation } from '../common/prisma/prisma-errors.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { isUuid } from '../common/uuid.js';
import { catalogNameTaken } from './catalog-rules.js';
import { toStatusView } from './catalog.presenter.js';
import type { StatusView } from './catalog.types.js';

/** WF8 (BR4.6): exactly four statuses; only their label changes. No create, no deactivation. */
@Injectable()
export class StatusesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Page<StatusView>> {
    // Ordering by the enum follows its declaration: OPEN, IN_ANALYSIS, WAITING_REQUESTER, CLOSED.
    const statuses = await this.prisma.status.findMany({ orderBy: { key: 'asc' } });
    return {
      items: statuses.map(toStatusView),
      total: statuses.length,
      page: FIRST_PAGE.page,
      pageSize: FIRST_PAGE.pageSize,
    };
  }

  async updateLabel(statusId: string, label: string): Promise<StatusView> {
    const exists =
      isUuid(statusId) &&
      (await this.prisma.status.findUnique({ where: { id: statusId }, select: { id: true } }));
    if (!exists) {
      throw new DomainError('CATALOG_ITEM_NOT_FOUND', 'Status not found');
    }
    try {
      const status = await this.prisma.status.update({
        where: { id: statusId },
        data: { label: label.trim() },
      });
      return toStatusView(status);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw catalogNameTaken();
      }
      throw error;
    }
  }
}
