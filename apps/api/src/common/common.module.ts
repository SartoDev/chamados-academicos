import { Global, Module } from '@nestjs/common';
import { Clock, SystemClock } from './clock.js';
import { AppEvents } from './events/app-events.js';
import { Argon2PasswordHasher, PasswordHasher } from './security/password-hasher.js';

@Global()
@Module({
  providers: [
    { provide: Clock, useClass: SystemClock },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    AppEvents,
  ],
  exports: [Clock, PasswordHasher, AppEvents],
})
export class CommonModule {}
