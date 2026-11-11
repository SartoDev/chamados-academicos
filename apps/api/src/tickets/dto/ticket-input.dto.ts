import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PageQueryDto } from '../../common/http/page-query.dto.js';
import { Trim } from '../../common/http/transforms.js';
import {
  QUEUE_SLICES,
  TICKET_LIST_VIEWS,
  type QueueSlice,
  type TicketListView,
} from '../rules/ticket-visibility.js';
import {
  SORT_ORDERS,
  TICKET_SORT_FIELDS,
  type SortOrder,
  type TicketSortField,
} from '../tickets.types.js';

/** Text limits fixed in Q3 and applied on both sides of the API (BR1.2, BR3.3). */
export const TITLE_MIN_LENGTH = 5;
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 2000;
export const JUSTIFICATION_MIN_LENGTH = 5;
export const JUSTIFICATION_MAX_LENGTH = 500;

/**
 * openTicket body (BR1.2 to BR1.4). The sector is derived from the category: a sector sent by
 * the client is an unknown field and the global pipe discards it (AC1.2.5, X-01).
 */
export class OpenTicketDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ minLength: TITLE_MIN_LENGTH, maxLength: TITLE_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MinLength(TITLE_MIN_LENGTH)
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @ApiProperty({ minLength: DESCRIPTION_MIN_LENGTH, maxLength: DESCRIPTION_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MinLength(DESCRIPTION_MIN_LENGTH)
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional; the default priority applies when omitted.',
  })
  @IsOptional()
  @IsUUID()
  priorityId?: string;
}

/** listTickets parameters (BR2.5, BR2.6, BR2.9). */
export class ListTicketsQueryDto extends PageQueryDto {
  @ApiProperty({
    enum: TICKET_LIST_VIEWS,
    description:
      'requested: the actor own tickets; queue: the sector queue; all: every ticket, for the administrator.',
  })
  @IsIn(TICKET_LIST_VIEWS)
  view!: TicketListView;

  @ApiPropertyOptional({
    enum: QUEUE_SLICES,
    default: 'all',
    description: 'Slice of the sector queue; passed lists what the sector handled before.',
  })
  @IsOptional()
  @IsIn(QUEUE_SLICES)
  queue?: QueueSlice;

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

  @ApiPropertyOptional({ enum: TICKET_SORT_FIELDS, default: 'updatedAt' })
  @IsOptional()
  @IsIn(TICKET_SORT_FIELDS)
  sort?: TicketSortField;

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'desc' })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  order?: SortOrder;
}

export class AssignTicketDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assigneeId!: string;
}

/** transferTicket body (BR3.3). */
export class TransferTicketDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetSectorId!: string;

  @ApiProperty({ minLength: JUSTIFICATION_MIN_LENGTH, maxLength: JUSTIFICATION_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MinLength(JUSTIFICATION_MIN_LENGTH)
  @MaxLength(JUSTIFICATION_MAX_LENGTH)
  justification!: string;
}

export class ChangeTicketPriorityDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  priorityId!: string;
}
