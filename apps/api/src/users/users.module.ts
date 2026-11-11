import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { UsersPublicService } from './users-public.service.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [CatalogModule],
  controllers: [UsersController],
  providers: [UsersService, UsersPublicService],
  exports: [UsersService, UsersPublicService],
})
export class UsersModule {}
