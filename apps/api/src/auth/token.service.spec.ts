import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { FakeClock, ONE_HOUR_MS } from '../../test/support/fake-clock.js';
import { SESSION_DURATION_SECONDS } from './session-cookie.js';
import { TokenService } from './token.service.js';

const SECRET = 'unit-test-only-secret-with-enough-length-00000';
const USER_ID = '0d8f2c1e-3b4a-4c5d-8e6f-7a8b9c0d1e2f';

describe('TokenService (BR1.5, BR1.7)', () => {
  let clock: FakeClock;
  let jwt: JwtService;
  let tokens: TokenService;

  beforeEach(() => {
    clock = new FakeClock();
    jwt = new JwtService({ secret: SECRET });
    tokens = new TokenService(jwt, clock);
  });

  it('issues a token that identifies only the user', () => {
    const token = tokens.issue(USER_ID);
    const payload = jwt.decode<Record<string, unknown>>(token);

    expect(tokens.verify(token)).toBe(USER_ID);
    expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'sub']);
    expect((payload.exp as number) - (payload.iat as number)).toBe(SESSION_DURATION_SECONDS);
  });

  it('keeps the token valid until just before 8 hours and rejects it at 8 hours', () => {
    const token = tokens.issue(USER_ID);

    clock.advanceBy(8 * ONE_HOUR_MS - 1000);
    expect(tokens.verify(token)).toBe(USER_ID);

    clock.advanceBy(1000);
    expect(tokens.verify(token)).toBeNull();
  });

  it('returns null for an absent or empty token', () => {
    expect(tokens.verify(undefined)).toBeNull();
    expect(tokens.verify('')).toBeNull();
  });

  it('returns null for a malformed or tampered token', () => {
    const token = tokens.issue(USER_ID);
    const [header, , signature] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: 'someone-else', iat: 1 })).toString(
      'base64url',
    );

    expect(tokens.verify('not-a-jwt')).toBeNull();
    expect(tokens.verify(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it('returns null for a token signed with another secret or with no signature', () => {
    const foreign = new JwtService({ secret: 'another-secret-with-enough-length-000000' }).sign({
      sub: USER_ID,
    });
    const unsigned = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(
      JSON.stringify({ sub: USER_ID }),
    ).toString('base64url')}.`;

    expect(tokens.verify(foreign)).toBeNull();
    expect(tokens.verify(unsigned)).toBeNull();
  });

  it('returns null for a valid signature whose payload has no subject', () => {
    const withoutSubject = jwt.sign({ purpose: 'other' });
    const numericSubject = jwt.sign({ sub: 42 });

    expect(tokens.verify(withoutSubject)).toBeNull();
    expect(tokens.verify(numericSubject)).toBeNull();
  });
});
