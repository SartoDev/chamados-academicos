import { describe, expect, it } from '@jest/globals';
import {
  canReadConversation,
  canWriteConversation,
  readRefusal,
  sendRefusal,
  type ConversationActor,
  type ConversationTicket,
} from './conversation-access.js';

const SECRETARIA = 'sector-secretaria';
const FINANCEIRO = 'sector-financeiro';
const BIBLIOTECA = 'sector-biblioteca';

const REQUESTER = 'user-student';
const ASSIGNEE = 'user-agent';
const OTHER_AGENT = 'user-other-agent';
const MANAGER = 'user-manager';

function ticket(overrides: Partial<ConversationTicket> = {}): ConversationTicket {
  return {
    requesterId: REQUESTER,
    assigneeId: ASSIGNEE,
    sectorId: SECRETARIA,
    passedSectorIds: [],
    statusKey: 'IN_ANALYSIS',
    ...overrides,
  };
}

const student: ConversationActor = { id: REQUESTER, role: 'STUDENT', sectorId: null };
const otherStudent: ConversationActor = { id: 'user-other', role: 'STUDENT', sectorId: null };
const professor: ConversationActor = { id: REQUESTER, role: 'PROFESSOR', sectorId: null };
const assignee: ConversationActor = { id: ASSIGNEE, role: 'AGENT', sectorId: SECRETARIA };
const sectorAgent: ConversationActor = { id: OTHER_AGENT, role: 'AGENT', sectorId: SECRETARIA };
const sectorManager: ConversationActor = { id: MANAGER, role: 'MANAGER', sectorId: SECRETARIA };
const foreignAgent: ConversationActor = { id: 'user-finance', role: 'AGENT', sectorId: FINANCEIRO };
const admin: ConversationActor = { id: 'user-admin', role: 'ADMIN', sectorId: null };

describe('conversation access (BR1.2, BR1.3, BR1.4)', () => {
  it('lets the requester read and write in their own ticket, whatever the requester role', () => {
    expect(canReadConversation(student, ticket())).toBe(true);
    expect(canWriteConversation(student, ticket())).toBe(true);
    expect(canReadConversation(professor, ticket())).toBe(true);
    expect(canWriteConversation(professor, ticket())).toBe(true);
  });

  it('hides the conversation from a requester who is not the one of the ticket', () => {
    expect(canReadConversation(otherStudent, ticket())).toBe(false);
    expect(readRefusal(otherStudent, ticket())).toBe('TICKET_NOT_FOUND');
    expect(sendRefusal(otherStudent, ticket())).toBe('TICKET_NOT_FOUND');
  });

  it('lets the current assignee read and write, even after the ticket changed status', () => {
    expect(canReadConversation(assignee, ticket())).toBe(true);
    expect(canWriteConversation(assignee, ticket())).toBe(true);
    expect(canWriteConversation(assignee, ticket({ statusKey: 'WAITING_REQUESTER' }))).toBe(true);
  });

  it('lets an agent of the current sector read, and refuses the send without hiding the ticket', () => {
    expect(canReadConversation(sectorAgent, ticket())).toBe(true);
    expect(canWriteConversation(sectorAgent, ticket())).toBe(false);
    expect(sendRefusal(sectorAgent, ticket())).toBe('FORBIDDEN');
  });

  it('lets the manager of the current sector write without taking the ticket (Q1)', () => {
    expect(canReadConversation(sectorManager, ticket())).toBe(true);
    expect(canWriteConversation(sectorManager, ticket())).toBe(true);
    expect(sendRefusal(sectorManager, ticket())).toBeNull();
  });

  it('lets a reader by sector passage read, and refuses their send (AC2.1.3)', () => {
    const passed = ticket({ sectorId: FINANCEIRO, passedSectorIds: [SECRETARIA, BIBLIOTECA] });

    expect(canReadConversation(sectorAgent, passed)).toBe(true);
    expect(canReadConversation(sectorManager, passed)).toBe(true);
    expect(canWriteConversation(sectorAgent, passed)).toBe(false);
    // The manager of a sector the ticket only passed through does not write either (BR1.3).
    expect(canWriteConversation(sectorManager, passed)).toBe(false);
    expect(sendRefusal(sectorManager, passed)).toBe('FORBIDDEN');
  });

  it('hides the conversation from a sector the ticket never touched', () => {
    expect(canReadConversation(foreignAgent, ticket())).toBe(false);
    expect(canWriteConversation(foreignAgent, ticket())).toBe(false);
    expect(sendRefusal(foreignAgent, ticket())).toBe('TICKET_NOT_FOUND');
  });

  it('hides the conversation from the administrator, who still sees the ticket (BR1.4, Q2)', () => {
    const asAssignee = ticket({ assigneeId: admin.id });

    expect(canReadConversation(admin, ticket())).toBe(false);
    expect(canWriteConversation(admin, ticket())).toBe(false);
    expect(readRefusal(admin, ticket())).toBe('TICKET_NOT_FOUND');
    // Not even as requester or assignee, which the data model would allow (BR1.4).
    expect(canReadConversation(admin, asAssignee)).toBe(false);
    expect(canReadConversation(admin, ticket({ requesterId: admin.id }))).toBe(false);
  });

  it('leaves only the requester writing on a ticket without an assignee (Q1)', () => {
    const unassigned = ticket({ assigneeId: null, statusKey: 'OPEN' });

    expect(canWriteConversation(student, unassigned)).toBe(true);
    expect(canWriteConversation(sectorAgent, unassigned)).toBe(false);
    expect(sendRefusal(sectorAgent, unassigned)).toBe('FORBIDDEN');
    // The manager of the sector is the exception: they answer without taking the ticket.
    expect(canWriteConversation(sectorManager, unassigned)).toBe(true);
  });

  it('refuses every send on a closed ticket, and keeps it readable (BR2.2)', () => {
    const closed = ticket({ statusKey: 'CLOSED' });

    expect(canReadConversation(student, closed)).toBe(true);
    expect(readRefusal(student, closed)).toBeNull();
    expect(sendRefusal(student, closed)).toBe('MESSAGE_TICKET_CLOSED');
    expect(sendRefusal(assignee, closed)).toBe('MESSAGE_TICKET_CLOSED');
    expect(sendRefusal(sectorManager, closed)).toBe('MESSAGE_TICKET_CLOSED');
    // Whoever may not read is still hidden the ticket, before the closed state is considered.
    expect(sendRefusal(foreignAgent, closed)).toBe('TICKET_NOT_FOUND');
    // And whoever reads but may not write is refused before it too.
    expect(sendRefusal(sectorAgent, closed)).toBe('FORBIDDEN');
  });

  it('ignores a sector role with no sector, which the data model forbids (BR3.3 of U1)', () => {
    const detachedAgent: ConversationActor = { id: 'user-loose', role: 'AGENT', sectorId: null };

    expect(canReadConversation(detachedAgent, ticket())).toBe(false);
    expect(canWriteConversation(detachedAgent, ticket())).toBe(false);
  });
});
