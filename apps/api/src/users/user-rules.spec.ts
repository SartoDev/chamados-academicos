import { describe, expect, it } from '@jest/globals';
import {
  adminProtectionViolation,
  isActiveAdmin,
  isAssignable,
  losesActiveAdmin,
  resolveSector,
} from './user-rules.js';

const SECRETARIA = 'd4d4d4d4-0000-4000-8000-000000000001';
const FINANCEIRO = 'd4d4d4d4-0000-4000-8000-000000000002';

describe('resolveSector (BR3.3)', () => {
  it('requires a sector for agents and managers', () => {
    expect(resolveSector('AGENT', undefined, null)).toEqual({ kind: 'missing' });
    expect(resolveSector('MANAGER', null, null)).toEqual({ kind: 'missing' });
  });

  it('clears the sector for roles without sector, even when one is sent or already set', () => {
    expect(resolveSector('STUDENT', SECRETARIA, null)).toEqual({ kind: 'none' });
    expect(resolveSector('PROFESSOR', undefined, SECRETARIA)).toEqual({ kind: 'none' });
    expect(resolveSector('ADMIN', SECRETARIA, SECRETARIA)).toEqual({ kind: 'none' });
  });

  it('keeps the current sector when none is sent or the same one is sent', () => {
    expect(resolveSector('AGENT', undefined, SECRETARIA)).toEqual({
      kind: 'keep',
      sectorId: SECRETARIA,
    });
    expect(resolveSector('AGENT', SECRETARIA, SECRETARIA)).toEqual({
      kind: 'keep',
      sectorId: SECRETARIA,
    });
  });

  it('asks to check a newly assigned sector', () => {
    expect(resolveSector('MANAGER', FINANCEIRO, SECRETARIA)).toEqual({
      kind: 'assign',
      sectorId: FINANCEIRO,
    });
    expect(resolveSector('AGENT', SECRETARIA, null)).toEqual({
      kind: 'assign',
      sectorId: SECRETARIA,
    });
  });

  it('refuses to remove the sector of an agent explicitly', () => {
    expect(resolveSector('AGENT', null, SECRETARIA)).toEqual({ kind: 'missing' });
  });
});

describe('admin protection (BR3.9)', () => {
  const activeAdmin = { role: 'ADMIN' as const, active: true };
  const actorId = 'e5e5e5e5-0000-4000-8000-000000000001';
  const otherId = 'e5e5e5e5-0000-4000-8000-000000000002';

  it('recognizes only active administrators', () => {
    expect(isActiveAdmin(activeAdmin)).toBe(true);
    expect(isActiveAdmin({ role: 'ADMIN', active: false })).toBe(false);
    expect(isActiveAdmin({ role: 'MANAGER', active: true })).toBe(false);
  });

  it('detects deactivation and demotion of an active admin only', () => {
    expect(losesActiveAdmin(activeAdmin, { role: 'ADMIN', active: false })).toBe(true);
    expect(losesActiveAdmin(activeAdmin, { role: 'STUDENT', active: true })).toBe(true);
    expect(losesActiveAdmin(activeAdmin, activeAdmin)).toBe(false);
    expect(
      losesActiveAdmin({ role: 'ADMIN', active: false }, { role: 'STUDENT', active: false }),
    ).toBe(false);
  });

  it('refuses an administrator deactivating or demoting themselves', () => {
    const input = { actorId, targetId: actorId, current: activeAdmin, activeAdminCount: 3 };

    expect(adminProtectionViolation({ ...input, next: { role: 'ADMIN', active: false } })).toBe(
      'USER_SELF_MODIFICATION_FORBIDDEN',
    );
    expect(adminProtectionViolation({ ...input, next: { role: 'AGENT', active: true } })).toBe(
      'USER_SELF_MODIFICATION_FORBIDDEN',
    );
  });

  it('refuses removing the last active administrator', () => {
    expect(
      adminProtectionViolation({
        actorId,
        targetId: otherId,
        current: activeAdmin,
        next: { role: 'ADMIN', active: false },
        activeAdminCount: 1,
      }),
    ).toBe('USER_LAST_ACTIVE_ADMIN');
  });

  it('allows it while another active administrator remains, and ignores unrelated changes', () => {
    expect(
      adminProtectionViolation({
        actorId,
        targetId: otherId,
        current: activeAdmin,
        next: { role: 'PROFESSOR', active: true },
        activeAdminCount: 2,
      }),
    ).toBeNull();
    expect(
      adminProtectionViolation({
        actorId,
        targetId: actorId,
        current: activeAdmin,
        next: activeAdmin,
        activeAdminCount: 1,
      }),
    ).toBeNull();
  });
});

describe('isAssignable (BR8.3)', () => {
  it('accepts active agents and managers of exactly that sector', () => {
    expect(isAssignable({ active: true, role: 'AGENT', sectorId: SECRETARIA }, SECRETARIA)).toBe(
      true,
    );
    expect(isAssignable({ active: true, role: 'MANAGER', sectorId: SECRETARIA }, SECRETARIA)).toBe(
      true,
    );
  });

  it('refuses missing, inactive, other-sector and non-attending users', () => {
    expect(isAssignable(null, SECRETARIA)).toBe(false);
    expect(isAssignable({ active: false, role: 'AGENT', sectorId: SECRETARIA }, SECRETARIA)).toBe(
      false,
    );
    expect(isAssignable({ active: true, role: 'AGENT', sectorId: FINANCEIRO }, SECRETARIA)).toBe(
      false,
    );
    expect(isAssignable({ active: true, role: 'ADMIN', sectorId: null }, SECRETARIA)).toBe(false);
  });
});
