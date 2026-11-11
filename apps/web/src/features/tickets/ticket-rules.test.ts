import { describe, expect, it } from 'vitest';
import { makeCurrentUser } from '@/test/fixtures';
import {
  agentRef,
  makeClosedTicket,
  makeTicket,
  makeTicketDetail,
  makeTicketInAnalysis,
  otherAgentRef,
  studentRef,
} from '@/test/ticket-fixtures';
import { availableTicketActions, canAssume, isWithinReopenWindow } from './ticket-rules';

const student = makeCurrentUser('STUDENT', { id: studentRef.id, name: studentRef.name });
const otherStudent = makeCurrentUser('STUDENT', { id: 'user-other-student' });
const agent = makeCurrentUser('AGENT', { id: agentRef.id, name: agentRef.name });
const otherAgent = makeCurrentUser('AGENT', { id: otherAgentRef.id });
const manager = makeCurrentUser('MANAGER', { id: 'user-manager' });
const admin = makeCurrentUser('ADMIN');
const financeAgent = makeCurrentUser('AGENT', {
  id: 'user-finance-agent',
  sector: { id: 'sector-financeiro', name: 'Financeiro' },
});

const NOW = new Date('2026-09-10T12:00:00.000Z').getTime();

describe('actions offered on the detail screen (BR9.4)', () => {
  it('lets the requester close their own ticket and nothing else', () => {
    const actions = availableTicketActions(student, makeTicketDetail(), NOW);

    expect(actions).toMatchObject({
      close: true,
      reopen: false,
      assume: false,
      assign: false,
      transfer: false,
      changePriority: false,
      waitForRequester: false,
    });
  });

  it('offers nothing on the ticket of somebody else or to the administrator (BR2.3)', () => {
    const ticket = makeTicketDetail();

    expect(availableTicketActions(otherStudent, ticket, NOW).close).toBe(false);
    expect(Object.values(availableTicketActions(admin, ticket, NOW))).toEqual(
      Array.from({ length: 7 }, () => false),
    );
    expect(Object.values(availableTicketActions(financeAgent, ticket, NOW))).toEqual(
      Array.from({ length: 7 }, () => false),
    );
  });

  it('offers the sector actions to the agent of the current sector', () => {
    const actions = availableTicketActions(agent, makeTicketDetail(), NOW);

    expect(actions).toMatchObject({
      assume: true,
      transfer: true,
      changePriority: true,
      assign: false,
      close: false,
      waitForRequester: false,
    });
  });

  it('gives the manager the assignment and the actions of the assignee (Q7)', () => {
    const inAnalysis = makeTicketInAnalysis();

    expect(availableTicketActions(manager, inAnalysis, NOW)).toMatchObject({
      assign: true,
      waitForRequester: true,
      close: true,
    });
    // The agent who holds the ticket may also wait and close it.
    expect(availableTicketActions(agent, inAnalysis, NOW)).toMatchObject({
      waitForRequester: true,
      close: true,
    });
    // Another agent of the sector may not.
    expect(availableTicketActions(otherAgent, inAnalysis, NOW)).toMatchObject({
      waitForRequester: false,
      close: false,
    });
  });

  it('offers the reopening only to the requester and only inside the window (BR4.3)', () => {
    const closedRecently = makeClosedTicket();
    const closedLongAgo = makeClosedTicket({
      closedAt: new Date(NOW - 73 * 60 * 60 * 1000).toISOString(),
    });

    expect(availableTicketActions(student, closedRecently, NOW).reopen).toBe(true);
    expect(availableTicketActions(student, closedLongAgo, NOW).reopen).toBe(false);
    expect(availableTicketActions(agent, closedRecently, NOW).reopen).toBe(false);
    expect(availableTicketActions(student, closedRecently, NOW).close).toBe(false);
  });

  it('counts the 72 hours of the window from the closing instant', () => {
    const closedAt = new Date(NOW - 71 * 60 * 60 * 1000).toISOString();

    expect(isWithinReopenWindow(closedAt, NOW)).toBe(true);
    expect(isWithinReopenWindow(new Date(NOW - 72 * 60 * 60 * 1000).toISOString(), NOW)).toBe(
      false,
    );
    expect(isWithinReopenWindow(null, NOW)).toBe(false);
  });
});

describe('taking a ticket from the queue (BR3.1, BR3.9)', () => {
  it('offers Assumir on a ticket without assignee', () => {
    expect(canAssume(agent, makeTicket())).toBe(true);
  });

  it('offers it when the assignee became unavailable, and hides it otherwise', () => {
    expect(
      canAssume(otherAgent, makeTicket({ assignee: agentRef, assigneeUnavailable: true })),
    ).toBe(true);
    expect(
      canAssume(otherAgent, makeTicket({ assignee: agentRef, assigneeUnavailable: false })),
    ).toBe(false);
  });

  it('lets the assignee take a reopened ticket back, and never offers it on a closed one', () => {
    expect(canAssume(agent, makeTicket({ assignee: agentRef }))).toBe(true);
    expect(canAssume(agent, makeClosedTicket())).toBe(false);
    expect(canAssume(student, makeTicket())).toBe(false);
  });
});
