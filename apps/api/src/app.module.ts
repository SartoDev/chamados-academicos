import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { CommonModule } from './common/common.module.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { ConfigModule } from './config/config.module.js';
import { ConversationModule } from './conversation/conversation.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ReportingModule } from './reporting/reporting.module.js';
import { SeedModule } from './seed/seed.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    PrismaModule,
    SeedModule,
    CatalogModule,
    UsersModule,
    AuthModule,
    NotificationsModule,
    TicketsModule,
    ConversationModule,
    ReportingModule,
  ],
})
export class AppModule {}
