import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { UsersModule } from '../users/users.module.js';
import { RatingController } from './rating.controller.js';
import { RatingService } from './rating.service.js';
import { TicketActionsController } from './ticket-actions.controller.js';
import { TicketActionsService } from './ticket-actions.service.js';
import { TicketsController } from './tickets.controller.js';
import { TicketsPublicService } from './tickets-public.service.js';
import { TicketsService } from './tickets.service.js';

/**
 * Tickets block of U2 (WF1 to WF10). It imports Notifications to record notifications in the
 * same ambient transaction as the change that caused them (BR6.3), and the public services of
 * U1 to resolve catalog items and people (SVC-01).
 *
 * U5 registers its rating controller and service here by addition: the rating is a sub-resource
 * of the ticket and its table belongs to U5 (BR4.1 of U5, DB-01). `RatingService` is exported so
 * the Reporting module of U4 can compose the rating summary of the panel without reading the
 * table itself; nothing of U2 changed shape.
 */
@Module({
  imports: [NotificationsModule, UsersModule, CatalogModule],
  controllers: [TicketsController, TicketActionsController, RatingController],
  providers: [TicketsService, TicketActionsService, TicketsPublicService, RatingService],
  exports: [TicketsPublicService, RatingService],
})
export class TicketsModule {}
