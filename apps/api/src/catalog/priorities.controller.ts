import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ALL_ROLES } from '../auth/actor.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SESSION_COOKIE_NAME } from '../auth/session-cookie.js';
import { ApiErrorResponses } from '../common/http/api-errors.decorator.js';
import { toPageRequest } from '../common/http/page-query.dto.js';
import { uuidParam } from '../common/http/uuid-param.pipe.js';
import type { Page } from '../common/pagination.js';
import type { PriorityView } from './catalog.types.js';
import {
  CreatePriorityDto,
  ListPrioritiesQueryDto,
  UpdatePriorityDto,
} from './dto/catalog-input.dto.js';
import { PriorityDto, PriorityPageDto } from './dto/catalog-response.dto.js';
import { PrioritiesService } from './priorities.service.js';

/** API-U1 priorities: read by any authenticated user, written by the administrator (BR2.7). */
@ApiTags('catalog')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('priorities')
export class PrioritiesController {
  constructor(private readonly priorities: PrioritiesService) {}

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({ operationId: 'listPriorities' })
  @ApiOkResponse({ type: PriorityPageDto })
  @ApiErrorResponses(400, 401)
  list(@Query() query: ListPrioritiesQueryDto): Promise<Page<PriorityView>> {
    return this.priorities.list({ active: query.active }, toPageRequest(query));
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ operationId: 'createPriority' })
  @ApiCreatedResponse({ type: PriorityDto })
  @ApiErrorResponses(400, 401, 403, 409)
  create(@Body() body: CreatePriorityDto): Promise<PriorityView> {
    return this.priorities.create(body);
  }

  @Patch(':priorityId')
  @Roles('ADMIN')
  @ApiOperation({ operationId: 'updatePriority' })
  @ApiOkResponse({
    type: PriorityDto,
    description: 'Priority updated; exactly one priority stays default.',
  })
  @ApiErrorResponses(400, 401, 403, 404, 409, 422)
  update(
    @Param('priorityId', uuidParam('priorityId')) priorityId: string,
    @Body() body: UpdatePriorityDto,
  ): Promise<PriorityView> {
    return this.priorities.update(priorityId, body);
  }
}
