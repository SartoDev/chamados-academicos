import { describe, expect, it } from '@jest/globals';
import {
  isAssignableInSector,
  isAssigneeUnavailable,
  type AssigneeSummary,
} from './assignee-availability.js';

const SECRETARIA = 'sector-secretaria';
const FINANCEIRO = 'sector-financeiro';

function summary(overrides: Partial<AssigneeSummary> = {}): AssigneeSummary {
  return { id: 'user-agent', role: 'AGENT', sectorId: SECRETARIA, active: true, ...overrides };
}

describe('assignee availability (BR3.9, BR8.3 of U1)', () => {
  it('accepts the active agent and the active manager of the sector', () => {
    expect(isAssignableInSector(summary(), SECRETARIA)).toBe(true);
    expect(isAssignableInSector(summary({ role: 'MANAGER' }), SECRETARIA)).toBe(true);
    expect(isAssigneeUnavailable('user-agent', summary(), SECRETARIA)).toBe(false);
  });

  it('marks a deactivated assignee as unavailable', () => {
    expect(isAssigneeUnavailable('user-agent', summary({ active: false }), SECRETARIA)).toBe(true);
  });

  it('marks an assignee moved to another sector as unavailable', () => {
    expect(isAssigneeUnavailable('user-agent', summary({ sectorId: FINANCEIRO }), SECRETARIA)).toBe(
      true,
    );
  });

  it('marks an assignee whose role no longer attends as unavailable', () => {
    expect(
      isAssigneeUnavailable('user-agent', summary({ role: 'STUDENT', sectorId: null }), SECRETARIA),
    ).toBe(true);
    expect(isAssignableInSector(summary({ role: 'ADMIN', sectorId: null }), SECRETARIA)).toBe(
      false,
    );
  });

  it('never marks a ticket without assignee, and marks one whose assignee is unknown', () => {
    expect(isAssigneeUnavailable(null, undefined, SECRETARIA)).toBe(false);
    expect(isAssigneeUnavailable('user-agent', undefined, SECRETARIA)).toBe(true);
    expect(isAssignableInSector(undefined, SECRETARIA)).toBe(false);
  });
});
