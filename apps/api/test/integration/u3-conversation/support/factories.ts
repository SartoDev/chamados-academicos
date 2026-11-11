import type { PrismaService } from '../../../../src/common/prisma/prisma.service.js';

/** Instant the conversation factories count from, so ordering is deterministic. */
export const CONVERSATION_START = new Date('2026-09-10T12:00:00.000Z');
export const ONE_MINUTE_MS = 60 * 1000;

let sequence = 0;
function nextSequence(): number {
  sequence += 1;
  return sequence;
}

export interface MessageOverrides {
  id?: string;
  body?: string;
  sentAt?: Date;
}

export interface CreateMessageInput extends MessageOverrides {
  ticketId: string;
  authorId: string;
}

export function createMessage(prisma: PrismaService, input: CreateMessageInput) {
  const n = nextSequence();
  return prisma.message.create({
    data: {
      ...(input.id === undefined ? {} : { id: input.id }),
      ticketId: input.ticketId,
      authorId: input.authorId,
      body: input.body ?? `Mensagem de teste ${n}.`,
      sentAt: input.sentAt ?? CONVERSATION_START,
    },
  });
}

/**
 * A conversation of `count` messages one minute apart, oldest first, all from the same author.
 * Enough to exercise paging and the tie-break without depending on the order of creation.
 */
export async function createConversation(
  prisma: PrismaService,
  ticketId: string,
  authorId: string,
  count: number,
  startAt: Date = CONVERSATION_START,
) {
  const created = [];
  for (let index = 0; index < count; index += 1) {
    created.push(
      await createMessage(prisma, {
        ticketId,
        authorId,
        body: `Mensagem ${index + 1}.`,
        sentAt: new Date(startAt.getTime() + index * ONE_MINUTE_MS),
      }),
    );
  }
  return created;
}

/** A body of exactly `length` characters, to exercise both ends of the limit (BR2.1). */
export function messageBodyOfLength(length: number): string {
  return 'a'.repeat(length);
}
