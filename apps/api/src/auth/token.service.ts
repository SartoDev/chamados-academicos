import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Clock } from '../common/clock.js';
import { SESSION_DURATION_SECONDS } from './session-cookie.js';

interface SessionTokenPayload {
  sub?: unknown;
}

/** Session token that identifies only the user (BR1.5). Time comes from the injected clock. */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly clock: Clock,
  ) {}

  issue(userId: string): string {
    return this.jwt.sign(
      { sub: userId, iat: this.nowInSeconds() },
      { expiresIn: SESSION_DURATION_SECONDS },
    );
  }

  /**
   * Returns the user id of a valid token, or null when the token is absent, malformed,
   * badly signed or expired; the guard answers 401 for null (BR1.7).
   */
  verify(token: string | undefined): string | null {
    if (!token) {
      return null;
    }
    let payload: SessionTokenPayload;
    try {
      payload = this.jwt.verify<SessionTokenPayload>(token, {
        algorithms: ['HS256'],
        clockTimestamp: this.nowInSeconds(),
      });
    } catch {
      return null;
    }
    return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
  }

  private nowInSeconds(): number {
    return Math.floor(this.clock.now().getTime() / 1000);
  }
}
