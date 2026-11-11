import { describe, expect, it } from '@jest/globals';
import {
  assignTargetRefusal,
  assumeConflictRefusal,
  canOpenTicket,
  isReadOnlyViewer,
  ticketActionRefusal,
  transferTargetRefusal,
  type PolicyActor,
  type PolicyTicket,
} from './ticket-action-policy.js';

const SECRETARIA = 'sector-secretaria';
const FINANCEIRO = 'sector-financeiro';

const student: PolicyActor = { id: 'user-student', role: 'STUDENT', sectorId: null };
const otherStudent: PolicyActor = { id: 'user-other-student', role: 'STUDENT', sectorId: null };
const professor: PolicyActor = { id: 'user-professor', role: 'PROFESSOR', sectorId: null };
const agent: PolicyActor = { id: 'user-agent', role: 'AGENT', sectorId: SECRETARIA };
const otherAgent: PolicyActor = { id: 'user-other-agent', role: 'AGENT', sectorId: SECRETARIA };
const financeAgent: PolicyActor = { id: 'user-finance-agent', role: 'AGENT', sectorId: FINANCEIRO };
const manager: PolicyActor = { id: 'user-manager', role: 'MANAGER', sectorId: SECRETARIA };
const financeManager: PolicyActor = {
  id: 'user-finance-manager',
  role: 'MANAGER',
  sectorId: FINANCEIRO,
};
const admin: PolicyActor = { id: 'user-admin', role: 'ADMIN', sectorId: null };

function ticket(overrides: Partial<PolicyTicket> = {}): PolicyTicket {
  return {
    requesterId: student.id,
    assigneeId: null,
    sectorId: SECRETARIA,
    statusKey: 'OPEN',
    ...overrides,
  };
}

describe('who opens a ticket (BR1.1)', () => {
  it('accepts a student and a professor, and nobody else', () => {
    expect(canOpenTicket('STUDENT')).toBe(true);
    expect(canOpenTicket('PROFESSOR')).toBe(true);
    expect(canOpenTicket('AGENT')).toBe(false);
    expect(canOpenTicket('MANAGER')).toBe(false);
    expect(canOpenTicket('ADMIN')).toBe(false);
  });
});

describe('who only reads (BR2.3, BR3.8)', () => {
  it('leaves the administrator and the sector of a past passage in read-only', () => {
    const inSecretaria = ticket();

    expect(isReadOnlyViewer(admin, inSecretaria)).toBe(true);
    expect(isReadOnlyViewer(financeAgent, inSecretaria)).toBe(true);
    expect(isReadOnlyViewer(agent, inSecretaria)).toBe(false);
    expect(isReadOnlyViewer(manager, inSecretaria)).toBe(false);
    expect(isReadOnlyViewer(student, inSecretaria)).toBe(false);
  });
});

describe('assuming a ticket (BR3.1)', () => {
  it('accepts the agent and the manager of the current sector', () => {
    expect(ticketActionRefusal('ASSUME', agent, ticket())).toBeNull();
    expect(ticketActionRefusal('ASSUME', manager, ticket())).toBeNull();
  });

  it('refuses a closed ticket before anything else', () => {
    expect(ticketActionRefusal('ASSUME', agent, ticket({ statusKey: 'CLOSED' }))).toBe(
      'TICKET_CLOSED',
    );
  });

  it('refuses whoever does not work in the current sector, including the administrator', () => {
    expect(ticketActionRefusal('ASSUME', financeAgent, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('ASSUME', financeManager, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('ASSUME', admin, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('ASSUME', student, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('ASSUME', professor, ticket())).toBe('FORBIDDEN');
  });

  it('refuses to take a ticket from an available assignee, and accepts an unavailable one', () => {
    const assigned = ticket({ assigneeId: otherAgent.id, statusKey: 'IN_ANALYSIS' });

    expect(assumeConflictRefusal(agent, assigned, true)).toBe('TICKET_ALREADY_ASSIGNED');
    expect(assumeConflictRefusal(agent, assigned, false)).toBeNull();
  });

  it('never conflicts with an empty assignee or with the actor themselves', () => {
    expect(assumeConflictRefusal(agent, ticket(), true)).toBeNull();
    expect(
      assumeConflictRefusal(agent, ticket({ assigneeId: agent.id, statusKey: 'OPEN' }), true),
    ).toBeNull();
  });
});

describe('assigning a ticket (BR3.2)', () => {
  it('accepts only the manager of the current sector', () => {
    expect(ticketActionRefusal('ASSIGN', manager, ticket())).toBeNull();
    expect(ticketActionRefusal('ASSIGN', agent, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('ASSIGN', financeManager, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('ASSIGN', admin, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('ASSIGN', student, ticket())).toBe('FORBIDDEN');
  });

  it('refuses a closed ticket and a destination outside the sector', () => {
    expect(ticketActionRefusal('ASSIGN', manager, ticket({ statusKey: 'CLOSED' }))).toBe(
      'TICKET_CLOSED',
    );
    expect(assignTargetRefusal(false)).toBe('TICKET_ASSIGNEE_NOT_IN_SECTOR');
    expect(assignTargetRefusal(true)).toBeNull();
  });
});

describe('transferring a ticket (BR3.3)', () => {
  it('accepts the agent and the manager of the current sector', () => {
    expect(ticketActionRefusal('TRANSFER', agent, ticket({ statusKey: 'IN_ANALYSIS' }))).toBeNull();
    expect(ticketActionRefusal('TRANSFER', manager, ticket())).toBeNull();
  });

  it('refuses a closed ticket, another sector, the requester and the administrator', () => {
    expect(ticketActionRefusal('TRANSFER', agent, ticket({ statusKey: 'CLOSED' }))).toBe(
      'TICKET_CLOSED',
    );
    expect(ticketActionRefusal('TRANSFER', financeAgent, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('TRANSFER', student, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('TRANSFER', admin, ticket())).toBe('FORBIDDEN');
  });

  it('refuses the current sector as destination and accepts another one', () => {
    expect(transferTargetRefusal(ticket(), SECRETARIA)).toBe('TICKET_TRANSFER_SAME_SECTOR');
    expect(transferTargetRefusal(ticket(), FINANCEIRO)).toBeNull();
  });
});

describe('waiting for the requester (BR3.4)', () => {
  it('accepts the current assignee and the manager of the sector', () => {
    const assigned = ticket({ assigneeId: agent.id, statusKey: 'IN_ANALYSIS' });

    expect(ticketActionRefusal('WAIT_FOR_REQUESTER', agent, assigned)).toBeNull();
    expect(ticketActionRefusal('WAIT_FOR_REQUESTER', manager, assigned)).toBeNull();
  });

  it('refuses another agent of the sector, other sectors and the requester', () => {
    const assigned = ticket({ assigneeId: agent.id, statusKey: 'IN_ANALYSIS' });

    expect(ticketActionRefusal('WAIT_FOR_REQUESTER', otherAgent, assigned)).toBe('FORBIDDEN');
    expect(ticketActionRefusal('WAIT_FOR_REQUESTER', financeAgent, assigned)).toBe('FORBIDDEN');
    expect(ticketActionRefusal('WAIT_FOR_REQUESTER', student, assigned)).toBe('FORBIDDEN');
    expect(ticketActionRefusal('WAIT_FOR_REQUESTER', admin, assigned)).toBe('FORBIDDEN');
  });

  it('leaves a closed ticket to the transition machine instead of refusing it as closed', () => {
    const closed = ticket({ assigneeId: agent.id, statusKey: 'CLOSED' });

    expect(ticketActionRefusal('WAIT_FOR_REQUESTER', agent, closed)).toBeNull();
  });
});

describe('closing a ticket (BR3.5, BR3.6)', () => {
  it('accepts the requester on their own ticket', () => {
    expect(ticketActionRefusal('CLOSE', student, ticket())).toBeNull();
    expect(
      ticketActionRefusal('CLOSE', professor, ticket({ requesterId: professor.id })),
    ).toBeNull();
  });

  it('refuses a requester on somebody else ticket', () => {
    expect(ticketActionRefusal('CLOSE', otherStudent, ticket())).toBe('FORBIDDEN');
  });

  it('accepts the assignee and the manager, and refuses another agent of the sector', () => {
    const assigned = ticket({ assigneeId: agent.id, statusKey: 'IN_ANALYSIS' });

    expect(ticketActionRefusal('CLOSE', agent, assigned)).toBeNull();
    expect(ticketActionRefusal('CLOSE', manager, assigned)).toBeNull();
    expect(ticketActionRefusal('CLOSE', otherAgent, assigned)).toBe('FORBIDDEN');
    expect(ticketActionRefusal('CLOSE', admin, assigned)).toBe('FORBIDDEN');
  });

  it('leaves closing an already closed ticket to the transition machine', () => {
    expect(ticketActionRefusal('CLOSE', student, ticket({ statusKey: 'CLOSED' }))).toBeNull();
  });
});

describe('reopening a ticket (BR4.3)', () => {
  it('accepts only the requester of the ticket', () => {
    const closed = ticket({ statusKey: 'CLOSED' });

    expect(ticketActionRefusal('REOPEN', student, closed)).toBeNull();
    expect(ticketActionRefusal('REOPEN', otherStudent, closed)).toBe('FORBIDDEN');
    expect(ticketActionRefusal('REOPEN', agent, closed)).toBe('FORBIDDEN');
    expect(ticketActionRefusal('REOPEN', manager, closed)).toBe('FORBIDDEN');
    expect(ticketActionRefusal('REOPEN', admin, closed)).toBe('FORBIDDEN');
  });
});

describe('changing the priority (BR3.7)', () => {
  it('accepts the agent and the manager of the current sector', () => {
    expect(ticketActionRefusal('CHANGE_PRIORITY', agent, ticket())).toBeNull();
    expect(ticketActionRefusal('CHANGE_PRIORITY', manager, ticket())).toBeNull();
  });

  it('refuses the requester, other sectors, the administrator and a closed ticket', () => {
    expect(ticketActionRefusal('CHANGE_PRIORITY', student, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('CHANGE_PRIORITY', financeAgent, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('CHANGE_PRIORITY', admin, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('CHANGE_PRIORITY', agent, ticket({ statusKey: 'CLOSED' }))).toBe(
      'TICKET_CLOSED',
    );
  });
});

describe('listing who may receive an assignment (BR8.5)', () => {
  it('accepts only the manager of the current sector', () => {
    expect(ticketActionRefusal('LIST_ASSIGNABLE', manager, ticket())).toBeNull();
    expect(ticketActionRefusal('LIST_ASSIGNABLE', agent, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('LIST_ASSIGNABLE', financeManager, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('LIST_ASSIGNABLE', student, ticket())).toBe('FORBIDDEN');
    expect(ticketActionRefusal('LIST_ASSIGNABLE', admin, ticket())).toBe('FORBIDDEN');
  });

  it('accepts the manager even on a closed ticket, which has no action to offer', () => {
    expect(
      ticketActionRefusal('LIST_ASSIGNABLE', manager, ticket({ statusKey: 'CLOSED' })),
    ).toBeNull();
  });
});
