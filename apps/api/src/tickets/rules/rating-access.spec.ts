import { describe, expect, it } from '@jest/globals';
import { ROLES, type Role } from '../../common/roles.js';
import {
  canRate,
  canReadRating,
  rateRefusal,
  readRefusal,
  type RatingActor,
  type RatingTicket,
} from './rating-access.js';

const SECRETARIA = 'sector-secretaria';
const FINANCEIRO = 'sector-financeiro';

const REQUESTER_ID = 'user-student';
const ASSIGNEE_ID = 'user-agent';

function actor(role: Role, overrides: Partial<RatingActor> = {}): RatingActor {
  return {
    id: `user-${role.toLowerCase()}`,
    role,
    sectorId: role === 'AGENT' || role === 'MANAGER' ? SECRETARIA : null,
    ...overrides,
  };
}

function ticket(overrides: Partial<RatingTicket> = {}): RatingTicket {
  return {
    requesterId: REQUESTER_ID,
    assigneeId: ASSIGNEE_ID,
    sectorId: SECRETARIA,
    passedSectorIds: [],
    statusKey: 'CLOSED',
    ...overrides,
  };
}

const requester = actor('STUDENT', { id: REQUESTER_ID });
const professorRequester = actor('PROFESSOR', { id: REQUESTER_ID });

describe('rating access (BR1.1 to BR1.3)', () => {
  describe('who rates (BR1.1)', () => {
    it.each(ROLES)('decides the write for %s on a closed ticket of the student', (role) => {
      const candidate = actor(role, role === 'STUDENT' ? { id: REQUESTER_ID } : {});

      expect(canRate(candidate, ticket())).toBe(role === 'STUDENT');
    });

    it('lets a professor rate the ticket they opened themselves', () => {
      expect(canRate(professorRequester, ticket())).toBe(true);
      expect(rateRefusal(professorRequester, ticket())).toBeNull();
    });

    it('refuses an agent, a manager and an administrator without hiding the ticket', () => {
      expect(rateRefusal(actor('AGENT'), ticket())).toBe('FORBIDDEN');
      expect(rateRefusal(actor('MANAGER'), ticket())).toBe('FORBIDDEN');
      expect(rateRefusal(actor('ADMIN'), ticket())).toBe('FORBIDDEN');
    });

    it('answers as if the ticket did not exist for a requester who is not its own', () => {
      const otherStudent = actor('STUDENT', { id: 'user-other-student' });

      expect(canRate(otherStudent, ticket())).toBe(false);
      expect(rateRefusal(otherStudent, ticket())).toBe('TICKET_NOT_FOUND');
    });

    it.each(['OPEN', 'IN_ANALYSIS', 'WAITING_REQUESTER'])(
      'refuses the requester while the ticket is %s (BR1.2)',
      (statusKey) => {
        expect(rateRefusal(requester, ticket({ statusKey }))).toBe('RATING_TICKET_NOT_CLOSED');
      },
    );

    it('checks the role before the requester and the requester before the status', () => {
      // An agent on an open ticket is refused for the role, not for the status, so the answer
      // never tells an actor without the right anything about the ticket.
      expect(rateRefusal(actor('AGENT'), ticket({ statusKey: 'OPEN' }))).toBe('FORBIDDEN');
      expect(
        rateRefusal(actor('STUDENT', { id: 'user-other-student' }), ticket({ statusKey: 'OPEN' })),
      ).toBe('TICKET_NOT_FOUND');
    });
  });

  describe('who reads (BR1.3)', () => {
    it.each(ROLES)('decides the read for %s on a ticket of Secretaria', (role) => {
      const candidate = actor(role, role === 'STUDENT' ? { id: REQUESTER_ID } : {});
      // Requester, agent and manager of the current sector, and the administrator all read;
      // a professor who is not the requester does not.
      const expected = role !== 'PROFESSOR';

      expect(canReadRating(candidate, ticket())).toBe(expected);
    });

    it('lets the requester and the current assignee read', () => {
      expect(canReadRating(requester, ticket())).toBe(true);
      expect(
        canReadRating(actor('AGENT', { id: ASSIGNEE_ID, sectorId: FINANCEIRO }), ticket()),
      ).toBe(true);
    });

    it('lets an agent of a sector the ticket passed through read (BR1.3)', () => {
      const passageAgent = actor('AGENT', { id: 'user-passage-agent', sectorId: FINANCEIRO });
      const passed = ticket({ sectorId: SECRETARIA, passedSectorIds: [FINANCEIRO] });

      expect(canReadRating(passageAgent, passed)).toBe(true);
      expect(canReadRating(passageAgent, ticket())).toBe(false);
    });

    it('lets the administrator read, unlike the conversation of U3 (Q4)', () => {
      expect(canReadRating(actor('ADMIN'), ticket())).toBe(true);
      expect(readRefusal(actor('ADMIN'), ticket())).toBeNull();
    });

    it('answers as if the ticket did not exist for everybody else', () => {
      const otherStudent = actor('STUDENT', { id: 'user-other-student' });
      const otherSectorAgent = actor('AGENT', { id: 'user-finance-agent', sectorId: FINANCEIRO });

      expect(readRefusal(otherStudent, ticket())).toBe('TICKET_NOT_FOUND');
      expect(readRefusal(otherSectorAgent, ticket())).toBe('TICKET_NOT_FOUND');
    });

    it('keeps an agent without a sector out of every ticket', () => {
      const sectorless = actor('AGENT', { id: 'user-loose-agent', sectorId: null });

      expect(canReadRating(sectorless, ticket({ passedSectorIds: [SECRETARIA] }))).toBe(false);
    });

    it('reads the rating of a ticket in any status, because the rating survives a reopen', () => {
      expect(canReadRating(requester, ticket({ statusKey: 'OPEN' }))).toBe(true);
      expect(readRefusal(actor('MANAGER'), ticket({ statusKey: 'IN_ANALYSIS' }))).toBeNull();
    });
  });
});
