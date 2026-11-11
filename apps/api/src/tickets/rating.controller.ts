import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ALL_ROLES, type Actor } from '../auth/actor.js';
import { CurrentActor } from '../auth/decorators/current-actor.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SESSION_COOKIE_NAME } from '../auth/session-cookie.js';
import { ApiErrorResponses } from '../common/http/api-errors.decorator.js';
import { uuidParam } from '../common/http/uuid-param.pipe.js';
import { RateTicketDto } from './dto/rating-input.dto.js';
import { RatingDto } from './dto/rating-response.dto.js';
import { RatingService } from './rating.service.js';
import type { RatingView } from './rating.types.js';
import { REQUESTER_ROLES } from './rules/rating-access.js';

/**
 * API-U5 (WF1, WF2). The path sits under the ticket because the rating is a sub-resource of it,
 * and the operations belong to U5. There is no edit and no delete route: the rating is written
 * once and never changes (BR2.3). An actor who may not see the ticket is answered as if it did
 * not exist (BR1.1, BR1.3). HTTP concerns only; the rules live in the service.
 */
@ApiTags('rating')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('tickets/:ticketId/rating')
export class RatingController {
  constructor(private readonly ratings: RatingService) {}

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({
    operationId: 'getTicketRating',
    description:
      'The rating of the ticket, readable by whoever may see the ticket: the requester, the current assignee, agents and managers of the current sector or of a sector it passed through, and the administrator. A ticket the actor cannot see answers TICKET_NOT_FOUND, and a visible ticket that was never rated answers RATING_NOT_FOUND (BR1.3).',
  })
  @ApiOkResponse({ type: RatingDto })
  @ApiErrorResponses(400, 401, 404)
  get(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
  ): Promise<RatingView> {
    return this.ratings.getRating(actor, ticketId);
  }

  @Put()
  @Roles(...REQUESTER_ROLES)
  @ApiOperation({
    operationId: 'rateTicket',
    description:
      'Only the requester of the ticket rates it, and only after it is closed (BR1.1, BR1.2). Declared divergence from the contract block: the verb stays PUT but the operation is not idempotent — the second call answers 409 RATING_ALREADY_EXISTS instead of repeating the result of the first, because the rating is written once and never changes (BR2.3, Q2).',
  })
  @ApiOkResponse({ type: RatingDto })
  @ApiErrorResponses(400, 401, 403, 404, 409)
  rate(
    @CurrentActor() actor: Actor,
    @Param('ticketId', uuidParam('ticketId')) ticketId: string,
    @Body() body: RateTicketDto,
  ): Promise<RatingView> {
    return this.ratings.rateTicket(actor, ticketId, { score: body.score, comment: body.comment });
  }
}
