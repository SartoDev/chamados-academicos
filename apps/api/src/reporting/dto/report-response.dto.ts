import { ApiProperty } from '@nestjs/swagger';

/** API-U4 response schemas (documentation only). */

export class TicketCountGroupDto {
  @ApiProperty({ format: 'uuid', description: 'Status, category or sector of the group.' })
  id!: string;

  @ApiProperty({ description: 'Resolved when read, including deactivated items (BR3.3).' })
  label!: string;

  @ApiProperty({ minimum: 0 })
  count!: number;
}

export class TicketCountsDto {
  @ApiProperty({
    type: [TicketCountGroupDto],
    description: 'Only the groups with at least one ticket in the period (BR3.1).',
  })
  groups!: TicketCountGroupDto[];

  @ApiProperty({ minimum: 0, description: 'Sum of the counts of the groups (BR3.2).' })
  total!: number;

  @ApiProperty({ format: 'date-time', description: 'Start of the period applied, included.' })
  from!: string;

  @ApiProperty({ format: 'date-time', description: 'End of the period applied, excluded.' })
  to!: string;
}

export class DurationAveragesDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    minimum: 0,
    description:
      'Seconds from the opening to the first assignment of the ticket; empty without a sample.',
  })
  averageHandlingSeconds!: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    minimum: 0,
    description: 'Seconds from the opening to the most recent closing; empty without a sample.',
  })
  averageResolutionSeconds!: number | null;

  @ApiProperty({
    minimum: 0,
    description: 'Tickets closed inside the period, the sample of the resolution average.',
  })
  resolutionSampleSize!: number;

  @ApiProperty({
    minimum: 0,
    description:
      'Of those, the ones that had an assignee: the sample of the handling average (BR4.3).',
  })
  handlingSampleSize!: number;

  @ApiProperty({ format: 'date-time', description: 'Start of the period applied, included.' })
  from!: string;

  @ApiProperty({ format: 'date-time', description: 'End of the period applied, excluded.' })
  to!: string;
}

export class RatingSummaryDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    minimum: 1,
    maximum: 5,
    description:
      'Average of the scores of the period; empty when the period holds no rating (BR3.2 of U5).',
  })
  averageScore!: number | null;

  @ApiProperty({
    minimum: 0,
    description: 'How many ratings the average came out of; never a ticket identifier.',
  })
  count!: number;

  @ApiProperty({ format: 'date-time', description: 'Start of the period applied, included.' })
  from!: string;

  @ApiProperty({ format: 'date-time', description: 'End of the period applied, excluded.' })
  to!: string;
}

export class ReportRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Resolved when read, including deactivated items and people.' })
  name!: string;
}

export class ReportTicketDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Visible identifier, a hash sign and the sequential number.' })
  reference!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: ReportRefDto })
  category!: ReportRefDto;

  @ApiProperty({ type: ReportRefDto })
  sector!: ReportRefDto;

  @ApiProperty({ type: ReportRefDto })
  status!: ReportRefDto;

  @ApiProperty({ type: ReportRefDto })
  priority!: ReportRefDto;

  @ApiProperty({ type: ReportRefDto, nullable: true })
  assignee!: ReportRefDto | null;

  @ApiProperty({ format: 'date-time' })
  openedAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

class ReportPageMetaDto {
  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  pageSize!: number;
}

export class ReportTicketPageDto extends ReportPageMetaDto {
  @ApiProperty({ type: [ReportTicketDto] })
  items!: ReportTicketDto[];
}
