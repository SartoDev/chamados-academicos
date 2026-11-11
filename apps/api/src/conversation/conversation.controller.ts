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
import { toPageRequest } from '../common/http/page-query.dto.js';
import { uuidParam } from '../common/http/uuid-param.pipe.js';
import type { Page } from '../common/pagination.js';
import { ConversationService } from './conversation.service.js';
import type { MessageView } from './conversation.types.js';
import { ListMessagesQueryDto, SendMessageDto } from './dto/message-input.dto.js';
import { MessageDto, MessagePageDto } from './dto/message-response.dto.js';

/**
 * API-U3 (WF1, WF2). The path sits under the ticket because the conversation is a sub-resource
 * of it, but the operations belong to U3. There is no edit and no delete route (BR2.3), and an
 * actor outside the access rule is answered as if the ticket did not exist (BR1.1, BR1.4).
 * HTTP concerns only; the rules live in the service.
 */
@ApiTags('conversation')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('tickets/:ticketId/messages')
export class ConversationController {
  constructor(private readonly conversation: ConversationService) {}

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({
    operationId: 'listMessages',
    description:
      'Messages of the ticket, chronological by default. Readable by the requester, the current assignee and agents and managers of the current sector or of a sector the ticket passed through; anybody else, the administrator included, is answered TICKET_NOT_FOUND (BR1.2, BR1.4).',
  })
  @ApiOkResponse({ type: MessagePageDto })
  @ApiErrorResponses(400, 401, 404)
  list(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<Page<MessageView>> {
    return this.conversation.listMessages(actor, ticketId, toPageRequest(query), query.order);
  }

  @Post()
  @Roles(...ALL_ROLES)
  @ApiOperation({
    operationId: 'sendMessage',
    description:
      'Only the requester, the current assignee and the manager of the current sector write; a reader who may not write is answered FORBIDDEN (BR1.3). A requester message on a ticket waiting for the requester moves it back to analysis (BR4.2).',
  })
  @ApiCreatedResponse({ type: MessageDto })
  @ApiErrorResponses(400, 401, 403, 404, 409)
  send(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
    @Body() body: SendMessageDto,
  ): Promise<MessageView> {
    return this.conversation.sendMessage(actor, ticketId, { body: body.body });
  }
}
