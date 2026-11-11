import { Injectable } from '@nestjs/common';
import { TransactionRunner, type DatabaseClient } from '../common/prisma/transaction-runner.js';
import { isUuid, uniqueUuids } from '../common/uuid.js';
import { isAssignable } from './user-rules.js';
import type { UserSummary } from './users.types.js';

/** Identifier and name of somebody who may receive a ticket of a sector (BR8.5 of U2). */
export interface AssignableUserRef {
  id: string;
  name: string;
}

/**
 * SVC-01 / SVC-02 public service of Users. Read-only, no route authorization of its own and
 * only contract types in its signatures (BR8.9).
 */
@Injectable()
export class UsersPublicService {
  constructor(private readonly transactions: TransactionRunner) {}

  /**
   * Reads go through the ambient transaction when the caller opened one, so a unit that reads
   * users during a write operation sees that operation's own state (BR7.1 of U2).
   */
  private get db(): DatabaseClient {
    return this.transactions.db();
  }

  /** BR8.2: inactive users included, unknown identifiers omitted, order not guaranteed. */
  async findSummariesByIds(ids: readonly string[]): Promise<UserSummary[]> {
    const validIds = uniqueUuids(ids);
    if (validIds.length === 0) {
      return [];
    }
    return this.db.user.findMany({
      where: { id: { in: validIds } },
      select: { id: true, name: true, role: true, sectorId: true, active: true },
    });
  }

  /** BR8.3: false when the user cannot be made assignee of a ticket in that sector. */
  async isAssignableInSector(userId: string, sectorId: string): Promise<boolean> {
    if (!isUuid(userId) || !isUuid(sectorId)) {
      return false;
    }
    const candidate = await this.db.user.findUnique({
      where: { id: userId },
      select: { active: true, role: true, sectorId: true },
    });
    return isAssignable(candidate, sectorId);
  }

  /**
   * BR8.5 of U2: active agents and managers of the sector, in name order, for the manager to
   * choose who receives an assignment. Additive extension of SVC-01.
   */
  async findAssignableInSector(sectorId: string): Promise<AssignableUserRef[]> {
    if (!isUuid(sectorId)) {
      return [];
    }
    return this.db.user.findMany({
      where: { sectorId, active: true, role: { in: ['AGENT', 'MANAGER'] } },
      select: { id: true, name: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }
}
