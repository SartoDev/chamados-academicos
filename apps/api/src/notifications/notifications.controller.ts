import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
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
import {
  ListNotificationsQueryDto,
  NotificationPageDto,
  UnreadNotificationCountDto,
} from './dto/notification.dto.js';
import { NotificationsService } from './notifications.service.js';
import type { NotificationView, UnreadCountView } from './notifications.types.js';

/** API-U2 notifications (WF11). Every operation is limited to the notifications of the actor. */
@ApiTags('notifications')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({ operationId: 'listNotifications', description: 'Newest first (BR6.4).' })
  @ApiOkResponse({ type: NotificationPageDto })
  @ApiErrorResponses(400, 401)
  list(
    @CurrentActor() actor: Actor,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<Page<NotificationView>> {
    return this.notifications.list(actor, { unreadOnly: query.unreadOnly }, toPageRequest(query));
  }

  @Get('unread-count')
  @Roles(...ALL_ROLES)
  @ApiOperation({ operationId: 'countUnreadNotifications' })
  @ApiOkResponse({ type: UnreadNotificationCountDto })
  @ApiErrorResponses(401)
  countUnread(@CurrentActor() actor: Actor): Promise<UnreadCountView> {
    return this.notifications.countUnread(actor);
  }

  @Post('read-all')
  @Roles(...ALL_ROLES)
  @HttpCode(204)
  @ApiOperation({ operationId: 'markAllNotificationsRead' })
  @ApiNoContentResponse({ description: 'Every unread notification of the actor marked as read.' })
  @ApiErrorResponses(401)
  async markAllRead(@CurrentActor() actor: Actor): Promise<void> {
    await this.notifications.markAllRead(actor);
  }

  @Post(':notificationId/read')
  @Roles(...ALL_ROLES)
  @HttpCode(204)
  @ApiOperation({ operationId: 'markNotificationRead', description: 'Idempotent (BR6.4).' })
  @ApiNoContentResponse({ description: 'Marked as read.' })
  @ApiErrorResponses(400, 401, 404)
  async markRead(
    @CurrentActor() actor: Actor,
    @Param('notificationId', uuidParam('notificationId')) notificationId: string,
  ): Promise<void> {
    await this.notifications.markRead(actor, notificationId);
  }
}
