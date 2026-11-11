import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Actor } from '../auth/actor.js';
import { CurrentActor } from '../auth/decorators/current-actor.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SESSION_COOKIE_NAME } from '../auth/session-cookie.js';
import { ApiErrorResponses } from '../common/http/api-errors.decorator.js';
import { toPageRequest } from '../common/http/page-query.dto.js';
import { uuidParam } from '../common/http/uuid-param.pipe.js';
import type { Page } from '../common/pagination.js';
import {
  CreateUserDto,
  ListUsersQueryDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './dto/user-input.dto.js';
import { UserDto, UserPageDto } from './dto/user-response.dto.js';
import { UsersService } from './users.service.js';
import type { UserView } from './users.types.js';

/** API-U1 users: administrator only (BR2.5, BR2.7). HTTP concerns only. */
@ApiTags('users')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ operationId: 'listUsers' })
  @ApiOkResponse({ type: UserPageDto })
  @ApiErrorResponses(400, 401, 403)
  list(@Query() query: ListUsersQueryDto): Promise<Page<UserView>> {
    return this.users.list(
      { role: query.role, active: query.active, sectorId: query.sectorId },
      toPageRequest(query),
    );
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ operationId: 'createUser' })
  @ApiCreatedResponse({ type: UserDto })
  @ApiErrorResponses(400, 401, 403, 404, 409, 422)
  create(@Body() body: CreateUserDto): Promise<UserView> {
    return this.users.create(body);
  }

  @Get(':userId')
  @Roles('ADMIN')
  @ApiOperation({ operationId: 'getUser' })
  @ApiOkResponse({ type: UserDto })
  @ApiErrorResponses(400, 401, 403, 404)
  get(@Param('userId', uuidParam('userId')) userId: string): Promise<UserView> {
    return this.users.getById(userId);
  }

  @Patch(':userId')
  @Roles('ADMIN')
  @ApiOperation({ operationId: 'updateUser' })
  @ApiOkResponse({
    type: UserDto,
    description: "User updated; a role or active change applies on the user's next request.",
  })
  @ApiErrorResponses(400, 401, 403, 404, 422)
  update(
    @CurrentActor() actor: Actor,
    @Param('userId', uuidParam('userId')) userId: string,
    @Body() body: UpdateUserDto,
  ): Promise<UserView> {
    return this.users.update(actor, userId, body);
  }

  @Put(':userId/password')
  @Roles('ADMIN')
  @HttpCode(204)
  @ApiOperation({ operationId: 'resetUserPassword' })
  @ApiNoContentResponse({
    description: 'Password replaced; the previous one no longer authenticates.',
  })
  @ApiErrorResponses(400, 401, 403, 404)
  async resetPassword(
    @Param('userId', uuidParam('userId')) userId: string,
    @Body() body: ResetPasswordDto,
  ): Promise<void> {
    await this.users.resetPassword(userId, body.password);
  }
}
