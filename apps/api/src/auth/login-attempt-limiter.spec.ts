import { beforeEach, describe, expect, it } from '@jest/globals';
import { FakeClock, ONE_MINUTE_MS } from '../../test/support/fake-clock.js';
import { AppEvents } from '../common/events/app-events.js';
import {
  ATTEMPT_WINDOW_MS,
  LoginAttemptLimiter,
  MAX_FAILED_ATTEMPTS,
  SWEEP_THRESHOLD,
} from './login-attempt-limiter.js';

describe('LoginAttemptLimiter (BR1.4, SM2)', () => {
  const email = 'ana.souza@example.test';
  let clock: FakeClock;
  let events: AppEvents;
  let limiter: LoginAttemptLimiter;

  function fail(times: number, address = email): void {
    for (let attempt = 0; attempt < times; attempt += 1) {
      limiter.recordFailure(address);
    }
  }

  beforeEach(() => {
    clock = new FakeClock();
    events = new AppEvents();
    limiter = new LoginAttemptLimiter(clock, events);
    limiter.onModuleInit();
  });

  it('lets an e-mail keep trying while it has fewer than five failures', () => {
    fail(MAX_FAILED_ATTEMPTS - 1);

    expect(limiter.blockedForSeconds(email)).toBe(0);
  });

  it('blocks after the fifth failure for the rest of the 15-minute window', () => {
    fail(MAX_FAILED_ATTEMPTS);
    expect(limiter.blockedForSeconds(email)).toBe(15 * 60);

    clock.advanceBy(10 * ONE_MINUTE_MS);

    expect(limiter.blockedForSeconds(email)).toBe(5 * 60);
  });

  it('opens the window at the first failure, not at the last one', () => {
    fail(1);
    clock.advanceBy(14 * ONE_MINUTE_MS);
    fail(MAX_FAILED_ATTEMPTS - 1);

    expect(limiter.blockedForSeconds(email)).toBe(60);
  });

  it('reports at least one second while still blocked and clears exactly when the window ends', () => {
    fail(MAX_FAILED_ATTEMPTS);

    clock.advanceBy(ATTEMPT_WINDOW_MS - 1);
    expect(limiter.blockedForSeconds(email)).toBe(1);

    clock.advanceBy(1);
    expect(limiter.blockedForSeconds(email)).toBe(0);
  });

  it('starts a fresh count after the window ends', () => {
    fail(MAX_FAILED_ATTEMPTS - 1);
    clock.advanceBy(ATTEMPT_WINDOW_MS);

    fail(MAX_FAILED_ATTEMPTS - 1);

    expect(limiter.blockedForSeconds(email)).toBe(0);
  });

  it('clears the count on reset, as after a successful login', () => {
    fail(MAX_FAILED_ATTEMPTS);

    limiter.reset(email);

    expect(limiter.blockedForSeconds(email)).toBe(0);
    fail(MAX_FAILED_ATTEMPTS - 1);
    expect(limiter.blockedForSeconds(email)).toBe(0);
  });

  it('treats letter case and surrounding spaces as the same e-mail and keeps others apart', () => {
    fail(MAX_FAILED_ATTEMPTS, '  Ana.Souza@Example.TEST ');

    expect(limiter.blockedForSeconds(email)).toBeGreaterThan(0);
    expect(limiter.blockedForSeconds('bruno.lima@example.test')).toBe(0);
  });

  it('clears the block when the password of that e-mail is reset (BR3.7)', () => {
    fail(MAX_FAILED_ATTEMPTS);

    events.emit('user.password-reset', { email });

    expect(limiter.blockedForSeconds(email)).toBe(0);
  });

  it('stops listening to password resets when the module is destroyed', () => {
    limiter.onModuleDestroy();
    fail(MAX_FAILED_ATTEMPTS);

    events.emit('user.password-reset', { email });

    expect(limiter.blockedForSeconds(email)).toBeGreaterThan(0);
  });

  it('sweeps expired windows once many e-mails are tracked', () => {
    for (let index = 0; index < SWEEP_THRESHOLD; index += 1) {
      limiter.recordFailure(`pessoa.${index}@example.test`);
    }
    clock.advanceBy(ATTEMPT_WINDOW_MS);

    limiter.recordFailure('nova.pessoa@example.test');

    expect(limiter.trackedEmailCount()).toBe(1);
  });
});
