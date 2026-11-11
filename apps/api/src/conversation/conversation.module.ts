import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { UsersModule } from '../users/users.module.js';
import { ConversationController } from './conversation.controller.js';
import { ConversationService } from './conversation.service.js';

/**
 * Conversation block of U3 (WF1, WF2). It reads the facts of the ticket and records the message
 * notification through the public services of U2, and resolves author names through the public
 * service of U1; it never queries a table of another unit (BR4.4, DB-01).
 */
@Module({
  imports: [TicketsModule, NotificationsModule, UsersModule],
  controllers: [ConversationController],
  providers: [ConversationService],
})
export class ConversationModule {}
