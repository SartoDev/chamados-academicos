import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ALL_ROLES, type Actor } from '../auth/actor.js';
import { CurrentActor } from '../auth/decorators/current-actor.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SESSION_COOKIE_NAME } from '../auth/session-cookie.js';
import { ApiErrorResponses } from '../common/http/api-errors.decorator.js';
import { PageQueryDto, toPageRequest } from '../common/http/page-query.dto.js';
import { uuidParam } from '../common/http/uuid-param.pipe.js';
import type { Page } from '../common/pagination.js';
import { ListTicketsQueryDto, OpenTicketDto } from './dto/ticket-input.dto.js';
import {
  AssignableUsersDto,
  TicketDetailDto,
  TicketHistoryPageDto,
  TicketPageDto,
  TicketSectorPassagePageDto,
} from './dto/ticket-response.dto.js';
import { TicketsService } from './tickets.service.js';
import type {
  AssignableUsersView,
  TicketDetailView,
  TicketHistoryEntryView,
  TicketListItemView,
  TicketSectorPassageView,
} from './tickets.types.js';

/** API-U2 reading and opening (WF1, WF2). HTTP concerns only; the rules live in the service. */
@ApiTags('tickets')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({
    operationId: 'listTickets',
    description:
      'Always filtered by the visibility of the actor inside the query. Each view is limited to its roles (BR2.9).',
  })
  @ApiOkResponse({ type: TicketPageDto })
  @ApiErrorResponses(400, 401, 403)
  list(
    @CurrentActor() actor: Actor,
    @Query() query: ListTicketsQueryDto,
  ): Promise<Page<TicketListItemView>> {
    return this.tickets.list(
      actor,
      {
        view: query.view,
        queue: query.queue,
        statusId: query.statusId,
        categoryId: query.categoryId,
        sectorId: query.sectorId,
        sort: query.sort,
        order: query.order,
      },
      toPageRequest(query),
    );
  }

  @Post()
  @Roles('STUDENT', 'PROFESSOR')
  @ApiOperation({
    operationId: 'openTicket',
    description: 'The sector comes from the category; a sector sent by the client is discarded.',
  })
  @ApiCreatedResponse({ type: TicketDetailDto })
  @ApiErrorResponses(400, 401, 403, 404, 422)
  open(@CurrentActor() actor: Actor, @Body() body: OpenTicketDto): Promise<TicketDetailView> {
    return this.tickets.open(actor, body);
  }

  @Get(':ticketId')
  @Roles(...ALL_ROLES)
  @ApiOperation({ operationId: 'getTicket' })
  @ApiOkResponse({ type: TicketDetailDto })
  @ApiErrorResponses(400, 401, 404)
  get(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
  ): Promise<TicketDetailView> {
    return this.tickets.getDetail(actor, ticketId);
  }

  @Get(':ticketId/history')
  @Roles(...ALL_ROLES)
  @ApiOperation({
    operationId: 'listTicketHistory',
    description: 'Changes in chronological order.',
  })
  @ApiOkResponse({ type: TicketHistoryPageDto })
  @ApiErrorResponses(400, 401, 404)
  listHistory(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
    @Query() query: PageQueryDto,
  ): Promise<Page<TicketHistoryEntryView>> {
    return this.tickets.listHistory(actor, ticketId, toPageRequest(query));
  }

  @Get(':ticketId/sector-passages')
  @Roles(...ALL_ROLES)
  @ApiOperation({
    operationId: 'listTicketSectorPassages',
    description: 'Every sector the ticket passed through, with entry and exit.',
  })
  @ApiOkResponse({ type: TicketSectorPassagePageDto })
  @ApiErrorResponses(400, 401, 404)
  listSectorPassages(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
    @Query() query: PageQueryDto,
  ): Promise<Page<TicketSectorPassageView>> {
    return this.tickets.listPassages(actor, ticketId, toPageRequest(query));
  }

  /** Additive operation of U2 (BR8.5), for the assignment dialog of the manager. */
  @Get(':ticketId/assignable-users')
  @Roles('MANAGER')
  @ApiOperation({
    operationId: 'listAssignableUsers',
    description: 'Active agents and managers of the current sector of the ticket.',
  })
  @ApiOkResponse({ type: AssignableUsersDto })
  @ApiErrorResponses(400, 401, 403, 404)
  listAssignableUsers(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
  ): Promise<AssignableUsersView> {
    return this.tickets.listAssignableUsers(actor, ticketId);
  }
}
