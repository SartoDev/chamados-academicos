import { describe, expect, it } from '@jest/globals';
import { expectDomainError } from '../../../test/support/expect-domain-error.js';
import type { AuthenticatedRequest } from '../guards/auth.guard.js';
import { resolveCurrentActor } from './current-actor.decorator.js';

describe('CurrentActor', () => {
  it('returns the actor resolved by the guard', () => {
    const actor = {
      id: 'c3c3c3c3-0000-4000-8000-000000000001',
      role: 'ADMIN' as const,
      sectorId: null,
    };

    expect(resolveCurrentActor({ actor } as AuthenticatedRequest)).toBe(actor);
  });

  it('fails when a route without actor asks for one', async () => {
    await expectDomainError(
      () => resolveCurrentActor({} as AuthenticatedRequest),
      'INTERNAL_ERROR',
    );
  });
});
