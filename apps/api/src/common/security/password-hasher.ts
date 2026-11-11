import { Injectable, Logger } from '@nestjs/common';
import { Algorithm, hash, verify } from '@node-rs/argon2';

/** BR3.5: passwords are stored only as a slow, brute-force resistant hash. */
export abstract class PasswordHasher {
  abstract hash(plainPassword: string): Promise<string>;
  abstract verify(passwordHash: string, plainPassword: string): Promise<boolean>;
}

// OWASP recommended argon2id parameters (19 MiB memory, 2 iterations, 1 lane).
const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

@Injectable()
export class Argon2PasswordHasher extends PasswordHasher {
  private readonly logger = new Logger(Argon2PasswordHasher.name);

  hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, ARGON2_OPTIONS);
  }

  async verify(passwordHash: string, plainPassword: string): Promise<boolean> {
    try {
      return await verify(passwordHash, plainPassword);
    } catch (error) {
      // A malformed stored hash cannot authenticate anyone; report it without failing the request.
      this.logger.warn(
        `Password hash could not be verified: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return false;
    }
  }
}
