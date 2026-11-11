import { Body, Controller, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Actor } from '../auth/actor.js';
import { CurrentActor } from '../auth/decorators/current-actor.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SESSION_COOKIE_NAME } from '../auth/session-cookie.js';
import { ApiErrorResponses } from '../common/http/api-errors.decorator.js';
import { uuidParam } from '../common/http/uuid-param.pipe.js';
import {
  AssignTicketDto,
  ChangeTicketPriorityDto,
  TransferTicketDto,
} from './dto/ticket-input.dto.js';
import { TicketDetailDto } from './dto/ticket-response.dto.js';
import { TicketActionsService } from './ticket-actions.service.js';
import type { TicketDetailView } from './tickets.types.js';

/**
 * API-U2 actions on a ticket (WF3 to WF9). Every action is a sub-resource with POST, except the
 * priority, which replaces a value (Q1). A ticket the actor cannot see answers TICKET_NOT_FOUND.
 */
@ApiTags('tickets')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('tickets/:ticketId')
export class TicketActionsController {
  constructor(private readonly actions: TicketActionsService) {}

  @Post('assume')
  @Roles('AGENT', 'MANAGER')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'assumeTicket',
    description: 'The actor becomes the assignee and an open ticket moves to analysis.',
  })
  @ApiOkResponse({ type: TicketDetailDto })
  @ApiErrorResponses(400, 401, 403, 404, 409)
  assume(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
  ): Promise<TicketDetailView> {
    return this.actions.assume(actor, ticketId);
  }

  @Post('assign')
  @Roles('MANAGER')
  @HttpCode(200)
  @ApiOperation({ operationId: 'assignTicket' })
  @ApiOkResponse({ type: TicketDetailDto })
  @ApiErrorResponses(400, 401, 403, 404, 409, 422)
  assign(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
    @Body() body: AssignTicketDto,
  ): Promise<TicketDetailView> {
    return this.actions.assign(actor, ticketId, body.assigneeId);
  }

  @Post('transfer')
  @Roles('AGENT', 'MANAGER')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'transferTicket',
    description: 'Assignee removed, ticket back to open in the queue of the destination sector.',
  })
  @ApiOkResponse({ type: TicketDetailDto })
  @ApiErrorResponses(400, 401, 403, 404, 422)
  transfer(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
    @Body() body: TransferTicketDto,
  ): Promise<TicketDetailView> {
    return this.actions.transfer(actor, ticketId, body);
  }

  @Post('wait-for-requester')
  @Roles('AGENT', 'MANAGER')
  @HttpCode(200)
  @ApiOperation({ operationId: 'waitForRequester' })
  @ApiOkResponse({ type: TicketDetailDto })
  @ApiErrorResponses(400, 401, 403, 404, 409)
  waitForRequester(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
  ): Promise<TicketDetailView> {
    return this.actions.waitForRequester(actor, ticketId);
  }

  @Post('close')
  @Roles('STUDENT', 'PROFESSOR', 'AGENT', 'MANAGER')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'closeTicket',
    description: 'A requester closes only their own ticket (BR3.6).',
  })
  @ApiOkResponse({ type: TicketDetailDto })
  @ApiErrorResponses(400, 401, 403, 404, 409)
  close(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
  ): Promise<TicketDetailView> {
    return this.actions.close(actor, ticketId);
  }

  @Post('reopen')
  @Roles('STUDENT', 'PROFESSOR')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'reopenTicket',
    description: 'Only the requester, within 72 hours of the closing (BR4.3).',
  })
  @ApiOkResponse({ type: TicketDetailDto })
  @ApiErrorResponses(400, 401, 403, 404, 409)
  reopen(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
  ): Promise<TicketDetailView> {
    return this.actions.reopen(actor, ticketId);
  }

  @Put('priority')
  @Roles('AGENT', 'MANAGER')
  @ApiOperation({ operationId: 'changeTicketPriority' })
  @ApiOkResponse({ type: TicketDetailDto })
  @ApiErrorResponses(400, 401, 403, 404, 422)
  changePriority(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
    @Body() body: ChangeTicketPriorityDto,
  ): Promise<TicketDetailView> {
    return this.actions.changePriority(actor, ticketId, body.priorityId);
  }
}
