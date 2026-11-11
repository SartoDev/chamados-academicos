import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Clock } from '../common/clock.js';
import { normalizeEmail } from '../common/email.js';
import { AppEvents } from '../common/events/app-events.js';

export const MAX_FAILED_ATTEMPTS = 5;
export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
/** Above this many tracked e-mails, expired windows are swept to bound memory. */
export const SWEEP_THRESHOLD = 10_000;

interface AttemptWindow {
  failures: number;
  startedAt: number;
}

/**
 * BR1.4 / SM2: failed logins per normalized e-mail, in process memory only (lost on restart).
 * The first failure opens a 15-minute window; after 5 failures in the window, new attempts
 * are refused until it ends. A successful login or a password reset clears the counter.
 */
@Injectable()
export class LoginAttemptLimiter implements OnModuleInit, OnModuleDestroy {
  private readonly windows = new Map<string, AttemptWindow>();
  private unsubscribe?: () => void;

  constructor(
    private readonly clock: Clock,
    private readonly events: AppEvents,
  ) {}

  onModuleInit(): void {
    // BR3.7: a password reset by the administrator clears the block of that e-mail.
    this.unsubscribe = this.events.on('user.password-reset', ({ email }) => this.reset(email));
  }

  onModuleDestroy(): void {
    this.unsubscribe?.();
  }

  /** Whole seconds until a blocked e-mail may try again; 0 when it may try now. */
  blockedForSeconds(email: string): number {
    const window = this.activeWindow(normalizeEmail(email));
    if (!window || window.failures < MAX_FAILED_ATTEMPTS) {
      return 0;
    }
    const remainingMs = window.startedAt + ATTEMPT_WINDOW_MS - this.clock.now().getTime();
    return Math.max(1, Math.ceil(remainingMs / 1000));
  }

  recordFailure(email: string): void {
    const key = normalizeEmail(email);
    const window = this.activeWindow(key);
    if (window) {
      window.failures += 1;
      return;
    }
    if (this.windows.size >= SWEEP_THRESHOLD) {
      this.sweepExpired();
    }
    this.windows.set(key, { failures: 1, startedAt: this.clock.now().getTime() });
  }

  reset(email: string): void {
    this.windows.delete(normalizeEmail(email));
  }

  trackedEmailCount(): number {
    return this.windows.size;
  }

  private activeWindow(key: string): AttemptWindow | undefined {
    const window = this.windows.get(key);
    if (window && this.isExpired(window)) {
      this.windows.delete(key);
      return undefined;
    }
    return window;
  }

  private isExpired(window: AttemptWindow): boolean {
    return this.clock.now().getTime() >= window.startedAt + ATTEMPT_WINDOW_MS;
  }

  private sweepExpired(): void {
    for (const [key, window] of this.windows) {
      if (this.isExpired(window)) {
        this.windows.delete(key);
      }
    }
  }
}
