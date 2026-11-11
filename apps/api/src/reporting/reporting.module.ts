import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { UsersModule } from '../users/users.module.js';
import { ReportingController } from './reporting.controller.js';
import { ReportingService } from './reporting.service.js';

/**
 * Reporting block of U4 (WF1 to WF4). Read-only: it owns no entity, writes nothing and never
 * queries a table of another unit (BR6.1, DB-01). Counts, duration averages and the filtered
 * listing come from the public service of U2, which applies the visibility of the actor inside
 * the query; labels and people come from the public services of U1 (BR1.2, BR3.3).
 */
@Module({
  imports: [TicketsModule, CatalogModule, UsersModule],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
