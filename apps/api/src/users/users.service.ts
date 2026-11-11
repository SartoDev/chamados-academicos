import { Injectable } from '@nestjs/common';
import type { Actor } from '../auth/actor.js';
import { CatalogPublicService } from '../catalog/catalog-public.service.js';
import { normalizeEmail } from '../common/email.js';
import { DomainError } from '../common/errors/domain-error.js';
import { AppEvents } from '../common/events/app-events.js';
import { toSkipTake, type Page, type PageRequest } from '../common/pagination.js';
import { acquireTransactionLock, LOCK_KEYS } from '../common/prisma/advisory-lock.js';
import { isUniqueConstraintViolation } from '../common/prisma/prisma-errors.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import type { Role } from '../common/roles.js';
import { PasswordHasher } from '../common/security/password-hasher.js';
import { isUuid } from '../common/uuid.js';
import { toCurrentUserView, toUserView, USER_WITH_SECTOR } from './user.presenter.js';
import { adminProtectionViolation, losesActiveAdmin, resolveSector } from './user-rules.js';
import type {
  CreateUserInput,
  CurrentUserView,
  ListUsersFilter,
  UpdateUserInput,
  UserCredentials,
  UserView,
} from './users.types.js';

const ADMIN_PROTECTION_MESSAGES = {
  USER_SELF_MODIFICATION_FORBIDDEN: 'An administrator cannot deactivate or demote themselves',
  USER_LAST_ACTIVE_ADMIN: 'The last active administrator cannot be deactivated or demoted',
} as const;

function userNotFound(): DomainError {
  return new DomainError('USER_NOT_FOUND', 'User not found');
}

function emailTaken(): DomainError {
  return new DomainError('USER_EMAIL_TAKEN', 'E-mail already belongs to a user');
}

/** User management rules (BR3.1 to BR3.10). The only place, with Catalog, that reads users. */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasher,
    private readonly catalog: CatalogPublicService,
    private readonly events: AppEvents,
  ) {}

  async list(filter: ListUsersFilter, page: PageRequest): Promise<Page<UserView>> {
    const where = { role: filter.role, active: filter.active, sectorId: filter.sectorId };
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: USER_WITH_SECTOR,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...toSkipTake(page),
      }),
    ]);
    return { items: users.map(toUserView), total, page: page.page, pageSize: page.pageSize };
  }

  async getById(userId: string): Promise<UserView> {
    const user = isUuid(userId)
      ? await this.prisma.user.findUnique({ where: { id: userId }, include: USER_WITH_SECTOR })
      : null;
    if (!user) {
      throw userNotFound();
    }
    return toUserView(user);
  }

  /** WF4. */
  async create(input: CreateUserInput): Promise<UserView> {
    const sectorId = await this.resolveSectorOrThrow(input.role, input.sectorId, null);
    const email = normalizeEmail(input.email);
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw emailTaken();
    }
    const passwordHash = await this.hasher.hash(input.password);
    try {
      const user = await this.prisma.user.create({
        data: { name: input.name.trim(), email, passwordHash, role: input.role, sectorId },
        include: USER_WITH_SECTOR,
      });
      return toUserView(user);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw emailTaken();
      }
      throw error;
    }
  }

  /**
   * WF5. The admin protection check and the write happen in one transaction serialized by an
   * advisory lock, so two concurrent requests cannot leave the system without an ADMIN (BR3.9).
   * New role, sector and state apply on the user's next request (BR3.6, BR3.8).
   */
  async update(actor: Actor, userId: string, input: UpdateUserInput): Promise<UserView> {
    if (!isUuid(userId)) {
      throw userNotFound();
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      await acquireTransactionLock(tx, LOCK_KEYS.ADMIN_PROTECTION);
      const target = await tx.user.findUnique({ where: { id: userId } });
      if (!target) {
        throw userNotFound();
      }
      const next = { role: input.role ?? target.role, active: input.active ?? target.active };
      const sectorId = await this.resolveSectorOrThrow(next.role, input.sectorId, target.sectorId);
      const activeAdminCount = losesActiveAdmin(target, next)
        ? await tx.user.count({ where: { role: 'ADMIN', active: true } })
        : 0;
      const violation = adminProtectionViolation({
        actorId: actor.id,
        targetId: target.id,
        current: target,
        next,
        activeAdminCount,
      });
      if (violation) {
        throw new DomainError(violation, ADMIN_PROTECTION_MESSAGES[violation]);
      }
      return tx.user.update({
        where: { id: userId },
        data: { name: input.name?.trim(), role: next.role, active: next.active, sectorId },
        include: USER_WITH_SECTOR,
      });
    });
    return toUserView(updated);
  }

  /** WF6: replaces the hash and clears the login attempt counter of the e-mail (BR3.7). */
  async resetPassword(userId: string, password: string): Promise<void> {
    const user = isUuid(userId)
      ? await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
      : null;
    if (!user) {
      throw userNotFound();
    }
    const passwordHash = await this.hasher.hash(password);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    this.events.emit('user.password-reset', { email: user.email });
  }

  /** Internal to U1 (Auth): credentials of a normalized e-mail, active or not. */
  findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: { id: true, passwordHash: true, active: true },
    });
  }

  /** Internal to U1 (Auth): the session owner, read on the current request. */
  async getCurrentUser(userId: string): Promise<CurrentUserView> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: USER_WITH_SECTOR,
    });
    if (!user) {
      throw new DomainError('UNAUTHENTICATED', 'Session user no longer exists');
    }
    return toCurrentUserView(user);
  }

  private async resolveSectorOrThrow(
    role: Role,
    requestedSectorId: string | null | undefined,
    currentSectorId: string | null,
  ): Promise<string | null> {
    const resolution = resolveSector(role, requestedSectorId, currentSectorId);
    switch (resolution.kind) {
      case 'none':
        return null;
      case 'missing':
        throw new DomainError('USER_SECTOR_REQUIRED', 'Agents and managers need a sector');
      case 'keep':
        return resolution.sectorId;
      case 'assign':
        // BR3.3, BR4.5: the sector must exist and be active to receive a user.
        await this.catalog.getActiveSector(resolution.sectorId);
        return resolution.sectorId;
    }
  }
}
