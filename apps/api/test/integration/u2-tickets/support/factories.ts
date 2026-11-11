import type { PrismaService } from '../../../../src/common/prisma/prisma.service.js';
import type {
  NotificationKind,
  TicketHistoryField,
} from '../../../../src/generated/prisma/client.js';
import type { TicketScenario } from './scenario.js';

export const ONE_HOUR_MS = 60 * 60 * 1000;

let sequence = 0;
function nextSequence(): number {
  sequence += 1;
  return sequence;
}

export interface TicketOverrides {
  title?: string;
  description?: string;
  /** Only to prove the sequence is unique; the database gives the number on its own (BR1.6). */
  number?: number;
  requesterId?: string;
  categoryId?: string;
  sectorId?: string;
  statusId?: string;
  priorityId?: string;
  assigneeId?: string | null;
  openedAt?: Date;
  updatedAt?: Date;
  closedAt?: Date | null;
}

export interface CreateTicketInput extends TicketOverrides {
  requesterId: string;
  categoryId: string;
  sectorId: string;
  statusId: string;
  priorityId: string;
}

/**
 * A ticket always comes with the open passage in its own sector, which is the invariant every
 * ticket of the application satisfies (BR1.5, BR5.2).
 */
export function createTicket(prisma: PrismaService, input: CreateTicketInput) {
  const n = nextSequence();
  const openedAt = input.openedAt ?? new Date('2026-09-01T09:00:00.000Z');
  return prisma.ticket.create({
    data: {
      ...(input.number === undefined ? {} : { number: input.number }),
      title: input.title ?? `Chamado de teste ${n}`,
      description: input.description ?? `Descrição do chamado de teste ${n}.`,
      requesterId: input.requesterId,
      assigneeId: input.assigneeId ?? null,
      categoryId: input.categoryId,
      sectorId: input.sectorId,
      statusId: input.statusId,
      priorityId: input.priorityId,
      openedAt,
      updatedAt: input.updatedAt ?? openedAt,
      closedAt: input.closedAt ?? null,
      sectorPassages: { create: { sectorId: input.sectorId, enteredAt: openedAt } },
    },
  });
}

/** Open, without assignee, in Secretaria: the state a ticket is born in (BR1.5). */
export function openTicketOfStudentInSecretaria(
  prisma: PrismaService,
  scenario: TicketScenario,
  overrides: TicketOverrides = {},
) {
  return createTicket(prisma, {
    requesterId: scenario.users.student,
    categoryId: scenario.categories.documentos,
    sectorId: scenario.sectors.secretaria,
    statusId: scenario.statuses.OPEN,
    priorityId: scenario.priorities.normal,
    ...overrides,
  });
}

/** In analysis with an assignee, the state that follows assuming or assigning (BR4.1). */
export function ticketInAnalysisAssignedTo(
  prisma: PrismaService,
  scenario: TicketScenario,
  assigneeId: string,
  overrides: TicketOverrides = {},
) {
  return openTicketOfStudentInSecretaria(prisma, scenario, {
    statusId: scenario.statuses.IN_ANALYSIS,
    assigneeId,
    ...overrides,
  });
}

/** Waiting for the requester, the only state the requester's message moves back (BR4.4). */
export function ticketWaitingRequester(
  prisma: PrismaService,
  scenario: TicketScenario,
  assigneeId: string,
  overrides: TicketOverrides = {},
) {
  return createTicket(prisma, {
    requesterId: scenario.users.student,
    categoryId: scenario.categories.documentos,
    sectorId: scenario.sectors.secretaria,
    statusId: scenario.statuses.WAITING_REQUESTER,
    priorityId: scenario.priorities.normal,
    assigneeId,
    ...overrides,
  });
}

/** Closed at a controlled distance from the current instant, for the 72 hour window (BR4.3). */
export function closedTicketHoursAgo(
  prisma: PrismaService,
  scenario: TicketScenario,
  hours: number,
  now: Date,
  overrides: TicketOverrides = {},
) {
  const closedAt = new Date(now.getTime() - hours * ONE_HOUR_MS);
  return createTicket(prisma, {
    requesterId: scenario.users.student,
    categoryId: scenario.categories.documentos,
    sectorId: scenario.sectors.secretaria,
    statusId: scenario.statuses.CLOSED,
    priorityId: scenario.priorities.normal,
    openedAt: new Date(closedAt.getTime() - ONE_HOUR_MS),
    updatedAt: closedAt,
    closedAt,
    ...overrides,
  });
}

/**
 * A ticket that left Secretaria and sits in Financeiro: Secretaria sees it in read-only through
 * its closed passage (BR2.2, BR3.8), and it belongs to the Financeiro queue.
 */
export async function ticketTransferredFromSecretariaToFinanceiro(
  prisma: PrismaService,
  scenario: TicketScenario,
  overrides: TicketOverrides = {},
) {
  const ticket = await createTicket(prisma, {
    requesterId: scenario.users.student,
    categoryId: scenario.categories.documentos,
    sectorId: scenario.sectors.secretaria,
    statusId: scenario.statuses.OPEN,
    priorityId: scenario.priorities.normal,
    ...overrides,
  });
  const leftAt = new Date(ticket.openedAt.getTime() + ONE_HOUR_MS);
  await prisma.ticketSectorPassage.updateMany({
    where: { ticketId: ticket.id, leftAt: null },
    data: {
      leftAt,
      justification: 'Assunto financeiro, fora do alcance da Secretaria.',
      transferredById: scenario.users.agent,
    },
  });
  await prisma.ticketSectorPassage.create({
    data: { ticketId: ticket.id, sectorId: scenario.sectors.financeiro, enteredAt: leftAt },
  });
  return prisma.ticket.update({
    where: { id: ticket.id },
    data: { sectorId: scenario.sectors.financeiro, assigneeId: null, updatedAt: leftAt },
  });
}

export interface PassageInput {
  ticketId: string;
  sectorId: string;
  enteredAt: Date;
  leftAt?: Date;
  justification?: string;
  transferredById?: string;
}

export function createSectorPassage(prisma: PrismaService, input: PassageInput) {
  return prisma.ticketSectorPassage.create({
    data: {
      ticketId: input.ticketId,
      sectorId: input.sectorId,
      enteredAt: input.enteredAt,
      leftAt: input.leftAt ?? null,
      justification: input.justification ?? null,
      transferredById: input.transferredById ?? null,
    },
  });
}

export interface HistoryEntryInput {
  ticketId: string;
  field: TicketHistoryField;
  authorId: string;
  previousValue?: string | null;
  newValue?: string | null;
  justification?: string | null;
  occurredAt?: Date;
}

export function createHistoryEntry(prisma: PrismaService, input: HistoryEntryInput) {
  return prisma.ticketHistoryEntry.create({
    data: {
      ticketId: input.ticketId,
      field: input.field,
      authorId: input.authorId,
      previousValue: input.previousValue ?? null,
      newValue: input.newValue ?? null,
      justification: input.justification ?? null,
      occurredAt: input.occurredAt ?? new Date('2026-09-01T10:00:00.000Z'),
    },
  });
}

export interface NotificationInput {
  recipientId: string;
  ticketId: string;
  kind?: NotificationKind;
  read?: boolean;
  createdAt?: Date;
  readAt?: Date | null;
}

export function createNotification(prisma: PrismaService, input: NotificationInput) {
  const read = input.read ?? false;
  return prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      ticketId: input.ticketId,
      kind: input.kind ?? 'STATUS_CHANGED',
      read,
      createdAt: input.createdAt ?? new Date('2026-09-01T10:00:00.000Z'),
      readAt: read ? (input.readAt ?? new Date('2026-09-01T11:00:00.000Z')) : null,
    },
  });
}
