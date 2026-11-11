import { describe, expect, it } from '@jest/globals';
import type { PolicyActor } from './ticket-action-policy.js';
import {
  isQueueSlice,
  isTicketListView,
  listCondition,
  listViewRefusal,
  queueSliceCondition,
  visibilityCondition,
  VIEW_ROLES,
} from './ticket-visibility.js';

const SECRETARIA = 'sector-secretaria';

const student: PolicyActor = { id: 'user-student', role: 'STUDENT', sectorId: null };
const professor: PolicyActor = { id: 'user-professor', role: 'PROFESSOR', sectorId: null };
const agent: PolicyActor = { id: 'user-agent', role: 'AGENT', sectorId: SECRETARIA };
const manager: PolicyActor = { id: 'user-manager', role: 'MANAGER', sectorId: SECRETARIA };
const agentWithoutSector: PolicyActor = { id: 'user-loose-agent', role: 'AGENT', sectorId: null };
const admin: PolicyActor = { id: 'user-admin', role: 'ADMIN', sectorId: null };

describe('visibility condition (BR2.1 to BR2.3)', () => {
  it('limits a requester to the tickets they opened', () => {
    expect(visibilityCondition(student)).toEqual({ requesterId: student.id });
    expect(visibilityCondition(professor)).toEqual({ requesterId: professor.id });
  });

  it('gives the attending roles the current sector and the sectors they handled before', () => {
    const expected = {
      OR: [{ sectorId: SECRETARIA }, { sectorPassages: { some: { sectorId: SECRETARIA } } }],
    };

    expect(visibilityCondition(agent)).toEqual(expected);
    expect(visibilityCondition(manager)).toEqual(expected);
  });

  it('shows nothing to an attending role without a sector', () => {
    expect(visibilityCondition(agentWithoutSector)).toEqual({ id: { in: [] } });
  });

  it('puts no restriction on the administrator', () => {
    expect(visibilityCondition(admin)).toEqual({});
  });
});

describe('who may ask for each listing (BR2.9)', () => {
  it('keeps each view for its roles', () => {
    expect(VIEW_ROLES).toEqual({
      requested: ['STUDENT', 'PROFESSOR'],
      queue: ['AGENT', 'MANAGER'],
      all: ['ADMIN'],
    });
    expect(listViewRefusal('requested', student)).toBeNull();
    expect(listViewRefusal('queue', agent)).toBeNull();
    expect(listViewRefusal('all', admin)).toBeNull();
  });

  it('refuses a view to the roles outside it', () => {
    expect(listViewRefusal('requested', agent)).toBe('FORBIDDEN');
    expect(listViewRefusal('requested', admin)).toBe('FORBIDDEN');
    expect(listViewRefusal('queue', student)).toBe('FORBIDDEN');
    expect(listViewRefusal('queue', admin)).toBe('FORBIDDEN');
    expect(listViewRefusal('all', manager)).toBe('FORBIDDEN');
    expect(listViewRefusal('all', professor)).toBe('FORBIDDEN');
  });

  it('refuses the queue with its own code when the actor has no sector (AC2.1.4)', () => {
    expect(listViewRefusal('queue', agentWithoutSector)).toBe('TICKET_QUEUE_NO_SECTOR');
  });
});

describe('queue slices (BR2.6)', () => {
  it('builds the four slices of the sector', () => {
    expect(queueSliceCondition('unassigned', SECRETARIA, agent.id)).toEqual({
      sectorId: SECRETARIA,
      assigneeId: null,
    });
    expect(queueSliceCondition('mine', SECRETARIA, agent.id)).toEqual({
      sectorId: SECRETARIA,
      assigneeId: agent.id,
    });
    expect(queueSliceCondition('all', SECRETARIA, agent.id)).toEqual({ sectorId: SECRETARIA });
    expect(queueSliceCondition('passed', SECRETARIA, agent.id)).toEqual({
      sectorId: { not: SECRETARIA },
      sectorPassages: { some: { sectorId: SECRETARIA } },
    });
  });

  it('turns each view into its condition', () => {
    expect(listCondition('requested', 'all', student)).toEqual({ requesterId: student.id });
    expect(listCondition('all', 'all', admin)).toEqual({});
    expect(listCondition('queue', 'unassigned', agent)).toEqual({
      sectorId: SECRETARIA,
      assigneeId: null,
    });
    expect(listCondition('queue', 'all', agentWithoutSector)).toEqual({ id: { in: [] } });
  });

  it('recognizes the values of the two parameters', () => {
    expect(isTicketListView('queue')).toBe(true);
    expect(isTicketListView('inbox')).toBe(false);
    expect(isQueueSlice('passed')).toBe(true);
    expect(isQueueSlice('archived')).toBe(false);
  });
});
