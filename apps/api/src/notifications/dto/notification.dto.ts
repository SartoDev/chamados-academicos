import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { PageQueryDto } from '../../common/http/page-query.dto.js';
import { ToBoolean } from '../../common/http/transforms.js';
import {
  NOTIFICATION_KINDS,
  type NotificationKindValue,
} from '../rules/notification-recipients.js';

/** listNotifications parameters (BR6.4). */
export class ListNotificationsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  unreadOnly?: boolean;
}

class PageMetaDto {
  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  pageSize!: number;
}

export class NotificationTicketRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  reference!: string;

  @ApiProperty()
  title!: string;
}

export class NotificationDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: NOTIFICATION_KINDS, enumName: 'NotificationKind' })
  kind!: NotificationKindValue;

  @ApiProperty({ type: NotificationTicketRefDto })
  ticket!: NotificationTicketRefDto;

  @ApiProperty()
  read!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', nullable: true })
  readAt!: string | null;
}

export class NotificationPageDto extends PageMetaDto {
  @ApiProperty({ type: [NotificationDto] })
  items!: NotificationDto[];
}

export class UnreadNotificationCountDto {
  @ApiProperty({ minimum: 0 })
  count!: number;
}
