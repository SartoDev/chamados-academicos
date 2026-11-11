import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PageQueryDto } from '../../common/http/page-query.dto.js';
import { IsOptionalDefined } from '../../common/http/transforms.js';
import { TICKET_COUNT_GROUP_BY, type TicketCountGroupBy } from '../../tickets/tickets.types.js';

/**
 * One bound of the period (BR2.1). It travels as text and is validated by `report-period`, so a
 * malformed instant always answers the same field code, whichever operation received it.
 */
function PeriodBound(description: string): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({ format: 'date-time', description }),
    IsOptionalDefined(),
    IsString(),
  );
}

const FROM_DESCRIPTION =
  'Start of the period, included. Defaults to thirty days before the end (BR7.2).';
const TO_DESCRIPTION = 'End of the period, excluded. Defaults to the current instant.';

/** `getAverageDurations` parameters; here the period cuts by the closing of the ticket. */
export class ReportPeriodQueryDto {
  @PeriodBound(FROM_DESCRIPTION)
  from?: string;

  @PeriodBound(TO_DESCRIPTION)
  to?: string;
}

/** `getTicketCounts` parameters (BR3.1). The grouping is required. */
export class TicketCountsQueryDto extends ReportPeriodQueryDto {
  @ApiProperty({
    enum: TICKET_COUNT_GROUP_BY,
    description: 'Groups the visible tickets of the period by status, category or sector.',
  })
  @IsIn(TICKET_COUNT_GROUP_BY)
  groupBy!: TicketCountGroupBy;
}

/** `searchTicketsForReport` parameters (BR5.1). Every filter is optional and combinable. */
export class ReportTicketsQueryDto extends PageQueryDto {
  @PeriodBound(FROM_DESCRIPTION)
  from?: string;

  @PeriodBound(TO_DESCRIPTION)
  to?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sectorId?: string;
}
