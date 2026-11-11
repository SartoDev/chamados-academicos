import { Body, Controller, Get, HttpCode, Inject, Post, Res } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiErrorResponses } from '../common/http/api-errors.decorator.js';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { UsersService } from '../users/users.service.js';
import type { CurrentUserView } from '../users/users.types.js';
import { ALL_ROLES, type Actor } from './actor.js';
import { CurrentActor } from './decorators/current-actor.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { Roles } from './decorators/roles.decorator.js';
import { CurrentUserDto } from './dto/current-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginService } from './login.service.js';
import {
  clearedSessionCookieOptions,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from './session-cookie.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly users: UsersService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  @ApiOperation({ operationId: 'login' })
  @ApiOkResponse({
    type: CurrentUserDto,
    description: 'Session started; Set-Cookie carries the httpOnly session cookie.',
  })
  @ApiErrorResponses(400, 401, 429)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CurrentUserView> {
    const { token, user } = await this.loginService.login(body.email, body.password);
    response.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(this.config.cookieSecure));
    return user;
  }

  /** BR1.6: always 204; the browser deletes the cookie, the server keeps no session state. */
  @Post('logout')
  @Public()
  @HttpCode(204)
  @ApiOperation({ operationId: 'logout' })
  @ApiNoContentResponse({
    description: 'Session cookie cleared in the browser; no server-side invalidation.',
  })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(
      SESSION_COOKIE_NAME,
      clearedSessionCookieOptions(this.config.cookieSecure),
    );
  }

  /** AC5.1.2: returns only the authenticated actor, read from the database on this request. */
  @Get('me')
  @Roles(...ALL_ROLES)
  @ApiCookieAuth(SESSION_COOKIE_NAME)
  @ApiOperation({ operationId: 'getCurrentUser' })
  @ApiOkResponse({ type: CurrentUserDto })
  @ApiErrorResponses(401)
  me(@CurrentActor() actor: Actor): Promise<CurrentUserView> {
    return this.users.getCurrentUser(actor.id);
  }
}
