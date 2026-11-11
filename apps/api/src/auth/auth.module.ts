import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './guards/auth.guard.js';
import { LoginAttemptLimiter } from './login-attempt-limiter.js';
import { LoginService } from './login.service.js';
import { TokenService } from './token.service.js';

/**
 * Auth depends on Users only (ADR-004 cycle resolved without late injection): Users and
 * Catalog declare roles through metadata decorators and inject nothing from Auth.
 */
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.jwtSecret,
        signOptions: { algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginAttemptLimiter,
    TokenService,
    LoginService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [TokenService],
})
export class AuthModule {}
