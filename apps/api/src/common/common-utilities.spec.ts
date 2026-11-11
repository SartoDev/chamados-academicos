import { describe, expect, it, jest } from '@jest/globals';
import { SystemClock } from './clock.js';
import { isEmailLike, normalizeEmail } from './email.js';
import { AppEvents } from './events/app-events.js';
import { DEFAULT_PAGE_SIZE, FIRST_PAGE, toSkipTake } from './pagination.js';
import { isRole, requiresSector } from './roles.js';
import { isUuid, uniqueUuids } from './uuid.js';

describe('e-mail helpers (BR1.1)', () => {
  it('normalizes case and surrounding spaces', () => {
    expect(normalizeEmail('  Ana.Souza@Example.TEST ')).toBe('ana.souza@example.test');
  });

  it('recognizes an e-mail shape', () => {
    expect(isEmailLike('ana@example.test')).toBe(true);
    expect(isEmailLike('ana@example')).toBe(false);
    expect(isEmailLike('ana example.test')).toBe(false);
  });
});

describe('uuid helpers', () => {
  const id = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

  it('accepts only well-formed UUIDs', () => {
    expect(isUuid(id)).toBe(true);
    expect(isUuid(id.toUpperCase())).toBe(true);
    expect(isUuid('7c9e6679')).toBe(false);
    expect(isUuid(42)).toBe(false);
  });

  it('keeps distinct well-formed identifiers only', () => {
    expect(uniqueUuids([id, id, 'x', ''])).toEqual([id]);
    expect(uniqueUuids(undefined)).toEqual([]);
  });
});

describe('pagination (X-01)', () => {
  it('translates a page request into skip and take', () => {
    expect(toSkipTake({ page: 3, pageSize: 20 })).toEqual({ skip: 40, take: 20 });
    expect(FIRST_PAGE).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });
});

describe('roles (BR3.2)', () => {
  it('knows exactly the five roles and which of them need a sector', () => {
    expect(['STUDENT', 'PROFESSOR', 'AGENT', 'MANAGER', 'ADMIN'].every(isRole)).toBe(true);
    expect(isRole('GUEST')).toBe(false);
    expect(isRole(undefined)).toBe(false);
    expect(requiresSector('AGENT')).toBe(true);
    expect(requiresSector('MANAGER')).toBe(true);
    expect(requiresSector('STUDENT')).toBe(false);
  });
});

describe('AppEvents', () => {
  it('delivers payloads to listeners until they unsubscribe', () => {
    const events = new AppEvents();
    const listener = jest.fn();
    const unsubscribe = events.on('user.password-reset', listener);

    events.emit('user.password-reset', { email: 'ana@example.test' });
    unsubscribe();
    events.emit('user.password-reset', { email: 'ana@example.test' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ email: 'ana@example.test' });
  });
});

describe('SystemClock', () => {
  it('returns the current instant', () => {
    const before = Date.now();
    const now = new SystemClock().now().getTime();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});
