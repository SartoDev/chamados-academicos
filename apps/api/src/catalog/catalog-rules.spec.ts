import { describe, expect, it } from '@jest/globals';
import { expectDomainError } from '../../test/support/expect-domain-error.js';
import {
  assertActiveItem,
  catalogNameTaken,
  defaultPriorityRequired,
  evaluatePriorityChange,
  isCategoryAvailable,
  isStatusKey,
} from './catalog-rules.js';

describe('assertActiveItem (BR8.4, BR8.5)', () => {
  it('returns an existing active item', () => {
    const sector = { id: 's1', active: true };

    expect(assertActiveItem(sector, 'Sector')).toBe(sector);
  });

  it('answers CATALOG_ITEM_NOT_FOUND before CATALOG_ITEM_INACTIVE', async () => {
    await expectDomainError(() => assertActiveItem(null, 'Sector'), 'CATALOG_ITEM_NOT_FOUND');
    const inactive = await expectDomainError(
      () => assertActiveItem({ active: false }, 'Priority'),
      'CATALOG_ITEM_INACTIVE',
    );
    expect(inactive.status).toBe(422);
  });
});

describe('isCategoryAvailable (BR4.4)', () => {
  it('offers a category only when it and its sector are active', () => {
    expect(isCategoryAvailable({ active: true, sector: { active: true } })).toBe(true);
    expect(isCategoryAvailable({ active: false, sector: { active: true } })).toBe(false);
    expect(isCategoryAvailable({ active: true, sector: { active: false } })).toBe(false);
  });
});

describe('isStatusKey (BR4.6)', () => {
  it('accepts exactly the four stable keys', () => {
    expect(['OPEN', 'IN_ANALYSIS', 'WAITING_REQUESTER', 'CLOSED'].every(isStatusKey)).toBe(true);
    expect(isStatusKey('open')).toBe(false);
    expect(isStatusKey('REOPENED')).toBe(false);
  });
});

describe('evaluatePriorityChange (BR4.7)', () => {
  const activeDefault = { isDefault: true, active: true };
  const activeRegular = { isDefault: false, active: true };
  const inactiveRegular = { isDefault: false, active: false };

  it('refuses unmarking the default without marking another', () => {
    expect(evaluatePriorityChange(activeDefault, { isDefault: false })).toEqual({
      allowed: false,
      becomesDefault: false,
    });
  });

  it('refuses deactivating the default priority', () => {
    expect(evaluatePriorityChange(activeDefault, { active: false }).allowed).toBe(false);
  });

  it('refuses marking an inactive priority as default', () => {
    expect(evaluatePriorityChange(inactiveRegular, { isDefault: true }).allowed).toBe(false);
  });

  it('moves the default mark to an active priority, including one reactivated in the same change', () => {
    expect(evaluatePriorityChange(activeRegular, { isDefault: true })).toEqual({
      allowed: true,
      becomesDefault: true,
    });
    expect(evaluatePriorityChange(inactiveRegular, { isDefault: true, active: true })).toEqual({
      allowed: true,
      becomesDefault: true,
    });
  });

  it('allows ordinary changes that keep the invariant', () => {
    expect(evaluatePriorityChange(activeDefault, {})).toEqual({
      allowed: true,
      becomesDefault: false,
    });
    expect(evaluatePriorityChange(activeDefault, { isDefault: true })).toEqual({
      allowed: true,
      becomesDefault: false,
    });
    expect(evaluatePriorityChange(activeRegular, { active: false })).toEqual({
      allowed: true,
      becomesDefault: false,
    });
  });

  it('builds the matching domain errors', () => {
    expect(defaultPriorityRequired().code).toBe('CATALOG_DEFAULT_PRIORITY_REQUIRED');
    expect(catalogNameTaken()).toMatchObject({ code: 'CATALOG_NAME_TAKEN', status: 409 });
  });
});
