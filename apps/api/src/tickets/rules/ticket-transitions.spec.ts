import { describe, expect, it } from '@jest/globals';
import {
  isTicketStatusKey,
  nextStatusKey,
  resolveTransition,
  TICKET_STATUS_KEYS,
  TICKET_TRANSITION_ACTIONS,
  VALID_TRANSITIONS,
} from './ticket-transitions.js';

/** The nine pairs of the table in stories.md, "Consequências para Artefatos Anteriores". */
const NINE_TRANSITIONS = [
  'OPEN->IN_ANALYSIS',
  'IN_ANALYSIS->WAITING_REQUESTER',
  'WAITING_REQUESTER->IN_ANALYSIS',
  'IN_ANALYSIS->OPEN',
  'WAITING_REQUESTER->OPEN',
  'OPEN->CLOSED',
  'IN_ANALYSIS->CLOSED',
  'WAITING_REQUESTER->CLOSED',
  'CLOSED->OPEN',
];

describe('ticket transition machine (BR4.1, ADR-006)', () => {
  it('knows exactly the nine transitions of the stories', () => {
    const pairs = new Set(VALID_TRANSITIONS.map((entry) => `${entry.from}->${entry.to}`));

    expect([...pairs].sort()).toEqual([...NINE_TRANSITIONS].sort());
  });

  it.each(VALID_TRANSITIONS)('moves $from to $to by $action', ({ from, to, action }) => {
    expect(resolveTransition(from, action)).toEqual({ kind: 'transition', from, to });
    expect(nextStatusKey(from, action)).toBe(to);
  });

  it('keeps the status when a ticket under way is taken over or reassigned (BR3.1, BR3.2)', () => {
    expect(resolveTransition('IN_ANALYSIS', 'ASSUME')).toEqual({
      kind: 'unchanged',
      status: 'IN_ANALYSIS',
    });
    expect(resolveTransition('WAITING_REQUESTER', 'ASSUME')).toEqual({
      kind: 'unchanged',
      status: 'WAITING_REQUESTER',
    });
    expect(resolveTransition('IN_ANALYSIS', 'ASSIGN')).toEqual({
      kind: 'unchanged',
      status: 'IN_ANALYSIS',
    });
    expect(nextStatusKey('WAITING_REQUESTER', 'ASSIGN')).toBe('WAITING_REQUESTER');
  });

  it('keeps an open ticket open when it is transferred', () => {
    expect(resolveTransition('OPEN', 'TRANSFER')).toEqual({ kind: 'unchanged', status: 'OPEN' });
  });

  it('refuses exactly the combinations outside the table', () => {
    const refused: string[] = [];
    for (const status of TICKET_STATUS_KEYS) {
      for (const action of TICKET_TRANSITION_ACTIONS) {
        if (resolveTransition(status, action).kind === 'invalid') {
          refused.push(`${status}/${action}`);
        }
      }
    }

    expect(refused).toEqual([
      'OPEN/WAIT_FOR_REQUESTER',
      'OPEN/REQUESTER_MESSAGE',
      'OPEN/REOPEN',
      'IN_ANALYSIS/REQUESTER_MESSAGE',
      'IN_ANALYSIS/REOPEN',
      'WAITING_REQUESTER/WAIT_FOR_REQUESTER',
      'WAITING_REQUESTER/REOPEN',
      'CLOSED/ASSUME',
      'CLOSED/ASSIGN',
      'CLOSED/WAIT_FOR_REQUESTER',
      'CLOSED/REQUESTER_MESSAGE',
      'CLOSED/TRANSFER',
      'CLOSED/CLOSE',
    ]);
  });

  it('accepts only reopening on a closed ticket, and answers null for the rest', () => {
    expect(nextStatusKey('CLOSED', 'REOPEN')).toBe('OPEN');
    expect(nextStatusKey('CLOSED', 'CLOSE')).toBeNull();
    expect(resolveTransition('CLOSED', 'TRANSFER')).toEqual({
      kind: 'invalid',
      status: 'CLOSED',
      action: 'TRANSFER',
    });
  });

  it('recognizes the four stable status keys and rejects anything else (M2)', () => {
    expect(TICKET_STATUS_KEYS).toEqual(['OPEN', 'IN_ANALYSIS', 'WAITING_REQUESTER', 'CLOSED']);
    expect(isTicketStatusKey('WAITING_REQUESTER')).toBe(true);
    expect(isTicketStatusKey('REOPENED')).toBe(false);
    expect(isTicketStatusKey(undefined)).toBe(false);
  });
});
