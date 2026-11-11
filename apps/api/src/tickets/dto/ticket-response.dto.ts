import { ApiProperty } from '@nestjs/swagger';
import { SectorRefDto } from '../../auth/dto/current-user.dto.js';
import { TICKET_STATUS_KEYS, type TicketStatusKey } from '../rules/ticket-transitions.js';
import type { TicketHistoryFieldValue } from '../tickets.types.js';

/** API-U2 response schemas (documentation only). */
class PageMetaDto {
  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  pageSize!: number;
}

export class UserRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class TicketCategoryRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class TicketStatusRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: TICKET_STATUS_KEYS, enumName: 'StatusKey' })
  key!: TicketStatusKey;

  @ApiProperty()
  label!: string;
}

export class TicketPriorityRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  label!: string;
}

export class TicketListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Visible identifier, a hash sign followed by the number (BR1.6).' })
  reference!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: TicketCategoryRefDto })
  category!: TicketCategoryRefDto;

  @ApiProperty({ type: SectorRefDto })
  sector!: SectorRefDto;

  @ApiProperty({ type: TicketStatusRefDto })
  status!: TicketStatusRefDto;

  @ApiProperty({ type: TicketPriorityRefDto })
  priority!: TicketPriorityRefDto;

  @ApiProperty({ type: UserRefDto })
  requester!: UserRefDto;

  @ApiProperty({ type: UserRefDto, nullable: true })
  assignee!: UserRefDto | null;

  @ApiProperty({
    description: 'The assignee can no longer receive tickets of the current sector (BR3.9).',
  })
  assigneeUnavailable!: boolean;

  @ApiProperty({ format: 'date-time' })
  openedAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class TicketDetailDto extends TicketListItemDto {
  @ApiProperty()
  description!: string;

  @ApiProperty({ format: 'date-time', nullable: true })
  closedAt!: string | null;
}

export class TicketPageDto extends PageMetaDto {
  @ApiProperty({ type: [TicketListItemDto] })
  items!: TicketListItemDto[];
}

export class TicketHistoryEntryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    enum: ['STATUS', 'ASSIGNEE', 'SECTOR', 'PRIORITY'],
    enumName: 'TicketHistoryField',
  })
  field!: TicketHistoryFieldValue;

  @ApiProperty({ nullable: true, description: 'Name resolved when read (BR5.1).' })
  previousValue!: string | null;

  @ApiProperty({ nullable: true })
  newValue!: string | null;

  @ApiProperty({ nullable: true, description: 'Justification of the transfer, on sector entries.' })
  justification!: string | null;

  @ApiProperty({ type: UserRefDto })
  author!: UserRefDto;

  @ApiProperty({ format: 'date-time' })
  occurredAt!: string;
}

export class TicketHistoryPageDto extends PageMetaDto {
  @ApiProperty({ type: [TicketHistoryEntryDto] })
  items!: TicketHistoryEntryDto[];
}

export class TicketSectorPassageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: SectorRefDto })
  sector!: SectorRefDto;

  @ApiProperty({ format: 'date-time' })
  enteredAt!: string;

  @ApiProperty({ format: 'date-time', nullable: true })
  leftAt!: string | null;

  @ApiProperty({ nullable: true })
  justification!: string | null;

  @ApiProperty({ type: UserRefDto, nullable: true })
  transferredBy!: UserRefDto | null;
}

export class TicketSectorPassagePageDto extends PageMetaDto {
  @ApiProperty({ type: [TicketSectorPassageDto] })
  items!: TicketSectorPassageDto[];
}

/** Who may receive an assignment in the current sector of the ticket (BR8.5). */
export class AssignableUsersDto {
  @ApiProperty({ type: [UserRefDto] })
  items!: UserRefDto[];
}
