import type { PrismaService } from '../../../../src/common/prisma/prisma.service.js';
import {
  createHistoryEntry,
  createTicket,
  type TicketOverrides,
} from '../../u2-tickets/support/factories.js';
import type { TicketScenario } from '../../u2-tickets/support/scenario.js';

export const ONE_HOUR_MS = 60 * 60 * 1000;

export interface ControlledTicketInput extends TicketOverrides {
  /** Instant the ticket was opened; the period of the counts cuts by it (BR3.1). */
  openedAt: Date;
  /**
   * Instant of the most recent closing, which is what the duration period cuts by (BR4.2,
   * BR4.3). Empty leaves the ticket open, so it stays out of both averages.
   */
  closedAt?: Date | null;
  /** First instant the ticket gained an assignee, the handling milestone of CA1 (BR4.1). */
  firstAssignedAt?: Date;
  /** Instant a later transfer removed the assignee again; it never moves the milestone. */
  unassignedAt?: Date;
  sectorId?: string;
  categoryId?: string;
}

/**
 * A ticket of the Secretaria sector whose opening, closing and first assignment are all fixed
 * by the caller, so every average and every period bound of U4 is verifiable by arithmetic
 * instead of by real time passing.
 */
export async function controlledTicket(
  prisma: PrismaService,
  scenario: TicketScenario,
  input: ControlledTicketInput,
) {
  const { firstAssignedAt, unassignedAt, ...overrides } = input;
  const closedAt = input.closedAt ?? null;
  const ticket = await createTicket(prisma, {
    requesterId: scenario.users.student,
    categoryId: input.categoryId ?? scenario.categories.documentos,
    sectorId: input.sectorId ?? scenario.sectors.secretaria,
    statusId: closedAt ? scenario.statuses.CLOSED : scenario.statuses.OPEN,
    priorityId: scenario.priorities.normal,
    ...overrides,
    closedAt,
    updatedAt: overrides.updatedAt ?? closedAt ?? input.openedAt,
  });
  if (firstAssignedAt) {
    const assigneeId = input.assigneeId ?? scenario.users.agent;
    await createHistoryEntry(prisma, {
      ticketId: ticket.id,
      field: 'ASSIGNEE',
      authorId: assigneeId,
      previousValue: null,
      newValue: assigneeId,
      occurredAt: firstAssignedAt,
    });
    if (unassignedAt) {
      // A transfer that removes the assignee writes a second entry; the milestone is still the
      // first assignment of the life of the ticket (BR4.1).
      await createHistoryEntry(prisma, {
        ticketId: ticket.id,
        field: 'ASSIGNEE',
        authorId: scenario.users.manager,
        previousValue: assigneeId,
        newValue: null,
        occurredAt: unassignedAt,
      });
    }
  }
  return ticket;
}

/** Status entries of a ticket that was closed, reopened and — optionally — closed again. */
export async function recordReopenHistory(
  prisma: PrismaService,
  scenario: TicketScenario,
  ticketId: string,
  instants: { firstClosedAt: Date; reopenedAt: Date; closedAgainAt?: Date },
): Promise<void> {
  await createHistoryEntry(prisma, {
    ticketId,
    field: 'STATUS',
    authorId: scenario.users.agent,
    previousValue: scenario.statuses.IN_ANALYSIS,
    newValue: scenario.statuses.CLOSED,
    occurredAt: instants.firstClosedAt,
  });
  await createHistoryEntry(prisma, {
    ticketId,
    field: 'STATUS',
    authorId: scenario.users.student,
    previousValue: scenario.statuses.CLOSED,
    newValue: scenario.statuses.OPEN,
    occurredAt: instants.reopenedAt,
  });
  if (instants.closedAgainAt) {
    await createHistoryEntry(prisma, {
      ticketId,
      field: 'STATUS',
      authorId: scenario.users.agent,
      previousValue: scenario.statuses.OPEN,
      newValue: scenario.statuses.CLOSED,
      occurredAt: instants.closedAgainAt,
    });
  }
}
