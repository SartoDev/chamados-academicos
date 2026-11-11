import { expect } from '@jest/globals';
import { DomainError } from '../../src/common/errors/domain-error.js';
import type { ErrorCode } from '../../src/common/errors/error-codes.js';

/** Awaits the action and asserts it failed with a DomainError carrying the expected code. */
export async function expectDomainError(
  action: Promise<unknown> | (() => unknown),
  code: ErrorCode,
): Promise<DomainError> {
  let caught: unknown;
  try {
    await (typeof action === 'function' ? action() : action);
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(DomainError);
  expect((caught as DomainError).code).toBe(code);
  return caught as DomainError;
}
