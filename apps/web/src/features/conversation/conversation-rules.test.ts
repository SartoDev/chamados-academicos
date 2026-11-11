import { describe, expect, it } from 'vitest';
import type { MessagePage } from '@/app/api/types';
import { makeCurrentUser } from '@/test/fixtures';
import { makeConversation, makeMessage, messagePage } from '@/test/message-fixtures';
import {
  agentRef,
  makeTicketDetail,
  makeTicketInAnalysis,
  managerRef,
  otherAgentRef,
  studentRef,
  financeiro,
} from '@/test/ticket-fixtures';
import { hasMorePages, mergeMessagePages } from './conversation-api';
import {
  canSeeConversationTab,
  canWriteMessage,
  isRequesterMessage,
  isTruncatable,
  newMessagesAnnouncement,
} from './conversation-rules';

const student = makeCurrentUser('STUDENT', { id: studentRef.id, name: studentRef.name });
const otherStudent = makeCurrentUser('STUDENT', { id: 'user-other-student' });
const assignee = makeCurrentUser('AGENT', { id: agentRef.id, name: agentRef.name });
const sectorAgent = makeCurrentUser('AGENT', { id: otherAgentRef.id, name: otherAgentRef.name });
const sectorManager = makeCurrentUser('MANAGER', { id: managerRef.id, name: managerRef.name });
const foreignManager = makeCurrentUser('MANAGER', {
  id: 'user-finance-manager',
  sector: financeiro,
});
const admin = makeCurrentUser('ADMIN');

describe('conversation rules on the client (BR1.3, BR5.1, BR5.4, BR5.5)', () => {
  it('offers the tab to the requester, to agents and to managers, never to the administrator', () => {
    const ticket = makeTicketInAnalysis();

    expect(canSeeConversationTab(student, ticket)).toBe(true);
    expect(canSeeConversationTab(sectorAgent, ticket)).toBe(true);
    expect(canSeeConversationTab(sectorManager, ticket)).toBe(true);
    expect(canSeeConversationTab(foreignManager, ticket)).toBe(true);
    expect(canSeeConversationTab(admin, ticket)).toBe(false);
    expect(canSeeConversationTab(otherStudent, ticket)).toBe(false);
  });

  it('shows the composer to the requester, the assignee and the sector manager (BR1.3)', () => {
    const ticket = makeTicketInAnalysis();

    expect(canWriteMessage(student, ticket)).toBe(true);
    expect(canWriteMessage(assignee, ticket)).toBe(true);
    expect(canWriteMessage(sectorManager, ticket)).toBe(true);
    expect(canWriteMessage(sectorAgent, ticket)).toBe(false);
    expect(canWriteMessage(foreignManager, ticket)).toBe(false);
    expect(canWriteMessage(admin, ticket)).toBe(false);
  });

  it('leaves only the requester writing on a ticket without an assignee (Q1)', () => {
    const unassigned = makeTicketDetail();

    expect(canWriteMessage(student, unassigned)).toBe(true);
    expect(canWriteMessage(sectorAgent, unassigned)).toBe(false);
    expect(canWriteMessage(sectorManager, unassigned)).toBe(true);
  });

  it('decides the side of a bubble by the requester of the ticket (BR5.1)', () => {
    const ticket = makeTicketInAnalysis();

    expect(isRequesterMessage(makeMessage({ author: studentRef }), ticket)).toBe(true);
    expect(isRequesterMessage(makeMessage({ author: agentRef }), ticket)).toBe(false);
  });

  it('folds only a body long enough to be worth folding (BR5.4)', () => {
    expect(isTruncatable('Mensagem curta.')).toBe(false);
    expect(isTruncatable('a'.repeat(401))).toBe(true);
    expect(isTruncatable(Array.from({ length: 7 }, (_, i) => `L${i}`).join('\n'))).toBe(true);
    expect(isTruncatable(Array.from({ length: 6 }, (_, i) => `L${i}`).join('\n'))).toBe(false);
  });

  it('writes the polite announcement in the singular and in the plural (BR5.5)', () => {
    expect(newMessagesAnnouncement(0)).toBe('');
    expect(newMessagesAnnouncement(-1)).toBe('');
    expect(newMessagesAnnouncement(1)).toBe('1 nova mensagem.');
    expect(newMessagesAnnouncement(3)).toBe('3 novas mensagens.');
  });
});

describe('joining the pages of the conversation (BR3.1, BR3.2, R-06)', () => {
  it('knows when there is an older page left to load', () => {
    expect(hasMorePages(messagePage(makeConversation(3), 1, 2, 5))).toBe(true);
    expect(hasMorePages(messagePage(makeConversation(3), 3, 2, 5))).toBe(false);
  });

  it('turns the descending pages into one chronological list', () => {
    const chronological = makeConversation(5);
    const first = messagePage(chronological, 1, 2, 5);
    const second = messagePage(chronological, 2, 2, 5);

    const joined = mergeMessagePages([first, second]);

    expect(joined.map((message) => message.body)).toEqual([
      'Mensagem 2.',
      'Mensagem 3.',
      'Mensagem 4.',
      'Mensagem 5.',
    ]);
  });

  it('drops a message repeated by a window that slid under a new arrival (R-06)', () => {
    const chronological = makeConversation(6);
    // The reader loads the newest page, and a message arrives before the next page is asked for.
    const firstPage = messagePage(chronological, 1, 3, 6);
    const arrived = makeMessage({
      id: 'message-arrived',
      body: 'Chegou enquanto você lia.',
      sentAt: new Date(Date.parse('2026-09-10T13:00:00.000Z')).toISOString(),
    });
    const afterArrival = [...chronological, arrived];
    // Page two of the shifted collection repeats the message that was last on page one.
    const secondPage: MessagePage = messagePage(afterArrival, 2, 3, 7);

    const joined = mergeMessagePages([firstPage, secondPage]);

    expect(new Set(joined.map((message) => message.id)).size).toBe(joined.length);
    expect(joined.map((message) => message.body)).toEqual([
      'Mensagem 2.',
      'Mensagem 3.',
      'Mensagem 4.',
      'Mensagem 5.',
      'Mensagem 6.',
    ]);
    // Nothing was lost: the repetition is invisible and no message fell between the windows.
    expect(joined.some((message) => message.id === 'message-arrived')).toBe(false);
  });

  it('breaks a tie of instants by identifier, as the server does (BR3.1)', () => {
    const sameInstant = '2026-09-10T12:00:00.000Z';
    const page: MessagePage = {
      items: [
        makeMessage({ id: 'ccc', body: 'C', sentAt: sameInstant }),
        makeMessage({ id: 'aaa', body: 'A', sentAt: sameInstant }),
        makeMessage({ id: 'bbb', body: 'B', sentAt: sameInstant }),
      ],
      total: 3,
      page: 1,
      pageSize: 50,
    };

    expect(mergeMessagePages([page]).map((message) => message.body)).toEqual(['A', 'B', 'C']);
  });

  it('answers an empty list when no page was loaded yet', () => {
    expect(mergeMessagePages([])).toEqual([]);
    expect(mergeMessagePages([messagePage([])])).toEqual([]);
  });
});
