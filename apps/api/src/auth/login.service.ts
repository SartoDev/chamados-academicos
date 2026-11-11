import { randomBytes } from 'node:crypto';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { normalizeEmail } from '../common/email.js';
import { DomainError } from '../common/errors/domain-error.js';
import { PasswordHasher } from '../common/security/password-hasher.js';
import type { CurrentUserView } from '../users/users.types.js';
import { UsersService } from '../users/users.service.js';
import { LoginAttemptLimiter } from './login-attempt-limiter.js';
import { TokenService } from './token.service.js';

export interface LoginResult {
  token: string;
  user: CurrentUserView;
}

/** WF1: login by e-mail and password. */
@Injectable()
export class LoginService implements OnModuleInit {
  private referenceHash?: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly hasher: PasswordHasher,
    private readonly limiter: LoginAttemptLimiter,
    private readonly tokens: TokenService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.getReferenceHash();
  }

  async login(emailInput: string, password: string): Promise<LoginResult> {
    const email = normalizeEmail(emailInput);
    const blockedForSeconds = this.limiter.blockedForSeconds(email);
    if (blockedForSeconds > 0) {
      throw new DomainError('AUTH_TOO_MANY_ATTEMPTS', 'Too many failed login attempts', {
        details: { retryAfterSeconds: blockedForSeconds },
        headers: { 'Retry-After': String(blockedForSeconds) },
      });
    }

    const credentials = await this.users.findCredentialsByEmail(email);
    // BR1.3: an unknown e-mail still pays for a real hash verification.
    const hashToVerify = credentials?.passwordHash ?? (await this.getReferenceHash());
    const passwordMatches = await this.hasher.verify(hashToVerify, password);

    // BR1.2: unknown e-mail, wrong password and inactive user get the very same answer.
    if (!credentials || !passwordMatches || !credentials.active) {
      this.limiter.recordFailure(email);
      throw new DomainError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials');
    }

    this.limiter.reset(email);
    return {
      token: this.tokens.issue(credentials.id),
      user: await this.users.getCurrentUser(credentials.id),
    };
  }

  private getReferenceHash(): Promise<string> {
    this.referenceHash ??= this.hasher.hash(randomBytes(32).toString('hex'));
    return this.referenceHash;
  }
}
