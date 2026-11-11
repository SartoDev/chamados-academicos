import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsPublicService } from './notifications-public.service.js';
import { NotificationsService } from './notifications.service.js';

/**
 * Notifications block of U2 (WF11, BR6.1 to BR6.6). It never imports Tickets: the ticket number
 * and title of a notification are read through the relation between U2's own tables (DB-01).
 */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsPublicService],
  exports: [NotificationsPublicService],
})
export class NotificationsModule {}
