import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ALL_ROLES } from '../auth/actor.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SESSION_COOKIE_NAME } from '../auth/session-cookie.js';
import { ApiErrorResponses } from '../common/http/api-errors.decorator.js';
import { uuidParam } from '../common/http/uuid-param.pipe.js';
import type { Page } from '../common/pagination.js';
import type { StatusView } from './catalog.types.js';
import { UpdateStatusDto } from './dto/catalog-input.dto.js';
import { StatusDto, StatusPageDto } from './dto/catalog-response.dto.js';
import { StatusesService } from './statuses.service.js';

/** API-U1 statuses: four fixed rows; the administrator edits only the label (BR4.6). */
@ApiTags('catalog')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('statuses')
export class StatusesController {
  constructor(private readonly statuses: StatusesService) {}

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({ operationId: 'listStatuses' })
  @ApiOkResponse({ type: StatusPageDto })
  @ApiErrorResponses(401)
  list(): Promise<Page<StatusView>> {
    return this.statuses.list();
  }

  @Patch(':statusId')
  @Roles('ADMIN')
  @ApiOperation({ operationId: 'updateStatus' })
  @ApiOkResponse({ type: StatusDto })
  @ApiErrorResponses(400, 401, 403, 404, 409)
  update(
    @Param('statusId', uuidParam('statusId')) statusId: string,
    @Body() body: UpdateStatusDto,
  ): Promise<StatusView> {
    return this.statuses.updateLabel(statusId, body.label);
  }
}
