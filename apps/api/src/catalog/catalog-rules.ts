import { DomainError } from '../common/errors/domain-error.js';
import { STATUS_KEYS, type StatusKeyValue } from './catalog.types.js';

/** BR8.4, BR8.5: an item must exist (404) and be active (422), checked in this order. */
export function assertActiveItem<T extends { active: boolean }>(item: T | null, kind: string): T {
  if (!item) {
    throw new DomainError('CATALOG_ITEM_NOT_FOUND', `${kind} not found`);
  }
  if (!item.active) {
    throw new DomainError('CATALOG_ITEM_INACTIVE', `${kind} is inactive`);
  }
  return item;
}

/** BR4.4: a category is offered for new tickets only when it and its sector are active. */
export function isCategoryAvailable(category: {
  active: boolean;
  sector: { active: boolean };
}): boolean {
  return category.active && category.sector.active;
}

export function isStatusKey(value: string): value is StatusKeyValue {
  return (STATUS_KEYS as readonly string[]).includes(value);
}

export interface PriorityState {
  isDefault: boolean;
  active: boolean;
}

export interface PriorityChange {
  isDefault?: boolean;
  active?: boolean;
}

export interface PriorityChangeEvaluation {
  allowed: boolean;
  /** The priority takes the default mark, which must leave the previous default atomically. */
  becomesDefault: boolean;
}

/**
 * BR4.7: exactly one default priority, always active. Refuses unmarking the default without
 * marking another, deactivating the default and marking an inactive priority as default.
 */
export function evaluatePriorityChange(
  current: PriorityState,
  change: PriorityChange,
): PriorityChangeEvaluation {
  const nextDefault = change.isDefault ?? current.isDefault;
  const nextActive = change.active ?? current.active;
  if (current.isDefault && !nextDefault) {
    return { allowed: false, becomesDefault: false };
  }
  if (nextDefault && !nextActive) {
    return { allowed: false, becomesDefault: false };
  }
  return { allowed: true, becomesDefault: nextDefault && !current.isDefault };
}

export function defaultPriorityRequired(): DomainError {
  return new DomainError(
    'CATALOG_DEFAULT_PRIORITY_REQUIRED',
    'There must always be exactly one active default priority',
  );
}

export function catalogNameTaken(): DomainError {
  return new DomainError('CATALOG_NAME_TAKEN', 'Name or label already used by another item');
}
