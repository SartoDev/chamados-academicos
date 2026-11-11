import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Actor } from '../auth/actor.js';
import { CurrentActor } from '../auth/decorators/current-actor.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SESSION_COOKIE_NAME } from '../auth/session-cookie.js';
import { ApiErrorResponses } from '../common/http/api-errors.decorator.js';
import { toPageRequest } from '../common/http/page-query.dto.js';
import type { Page } from '../common/pagination.js';
import {
  ReportPeriodQueryDto,
  ReportTicketsQueryDto,
  TicketCountsQueryDto,
} from './dto/report-input.dto.js';
import {
  DurationAveragesDto,
  RatingSummaryDto,
  ReportTicketPageDto,
  TicketCountsDto,
} from './dto/report-response.dto.js';
import { ReportingService } from './reporting.service.js';
import type {
  DurationAveragesView,
  RatingSummaryView,
  ReportTicketRowView,
  TicketCountsView,
} from './reporting.types.js';
import { REPORT_OPERATION_ROLES } from './rules/report-access.js';

/**
 * API-U4 (WF1 to WF4). Read-only: there is no write operation, no download route and no export
 * of any kind (BR5.2). The role markers come from `report-access`, the single source of truth of
 * BR1.1, and the visibility of the actor is applied by U2 inside every query (BR1.2). HTTP
 * concerns only; the rules live in the service.
 */
@ApiTags('reports')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('reports')
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @Get('ticket-counts')
  @Roles(...REPORT_OPERATION_ROLES.ticketCounts)
  @ApiOperation({
    operationId: 'getTicketCounts',
    description:
      'Visible tickets of the period grouped by status, category or sector, with the period cutting by the opening of the ticket. A group without tickets in the period is omitted, and an empty period answers an empty list and total 0 (BR3.1, BR2.2).',
  })
  @ApiOkResponse({ type: TicketCountsDto })
  @ApiErrorResponses(400, 401, 403)
  getTicketCounts(
    @CurrentActor() actor: Actor,
    @Query() query: TicketCountsQueryDto,
  ): Promise<TicketCountsView> {
    return this.reporting.getTicketCounts(actor, query.groupBy, {
      from: query.from,
      to: query.to,
    });
  }

  @Get('durations')
  @Roles(...REPORT_OPERATION_ROLES.durationAverages)
  @ApiOperation({
    operationId: 'getAverageDurations',
    description:
      'Average handling and resolution times of the period, in seconds, with no goal and no threshold. Handling runs from the opening to the first assignment and resolution from the opening to the most recent closing; here the period cuts by the closing, not by the opening. Declared divergence from the contract block: the single `sampleSize` became `resolutionSampleSize` and `handlingSampleSize`, because the handling average excludes the tickets closed without an assignee (BR4.1 to BR4.4).',
  })
  @ApiOkResponse({ type: DurationAveragesDto })
  @ApiErrorResponses(400, 401, 403)
  getAverageDurations(
    @CurrentActor() actor: Actor,
    @Query() query: ReportPeriodQueryDto,
  ): Promise<DurationAveragesView> {
    return this.reporting.getDurationAverages(actor, { from: query.from, to: query.to });
  }

  @Get('ratings')
  @Roles(...REPORT_OPERATION_ROLES.ratingSummary)
  @ApiOperation({
    operationId: 'getRatingSummary',
    description:
      'Average and count of the ratings of the period, added to the panel by U5. The period cuts by the closing of the ticket, like the average durations, so a ticket reopened and still open leaves the average and comes back in the period of its next closing. A period without ratings answers an empty average and a count of zero, never a zero read as a score, and neither the comment nor any ticket identifier travels here (BR3.1 to BR3.3 of U5).',
  })
  @ApiOkResponse({ type: RatingSummaryDto })
  @ApiErrorResponses(400, 401, 403)
  getRatingSummary(
    @CurrentActor() actor: Actor,
    @Query() query: ReportPeriodQueryDto,
  ): Promise<RatingSummaryView> {
    return this.reporting.getRatingSummary(actor, { from: query.from, to: query.to });
  }

  @Get('tickets')
  @Roles(...REPORT_OPERATION_ROLES.ticketSearch)
  @ApiOperation({
    operationId: 'searchTicketsForReport',
    description:
      'On-screen listing with combinable filters, cut by the opening of the ticket. The manager alone calls it: the administrator reads everything through the general listing of U2, which has no period window (BR1.1, BR5.1, Q5).',
  })
  @ApiOkResponse({ type: ReportTicketPageDto })
  @ApiErrorResponses(400, 401, 403)
  searchTicketsForReport(
    @CurrentActor() actor: Actor,
    @Query() query: ReportTicketsQueryDto,
  ): Promise<Page<ReportTicketRowView>> {
    return this.reporting.searchTickets(
      actor,
      { statusId: query.statusId, categoryId: query.categoryId, sectorId: query.sectorId },
      { from: query.from, to: query.to },
      toPageRequest(query),
    );
  }
}
