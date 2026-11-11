import { Module } from '@nestjs/common';
import { CatalogPublicService } from './catalog-public.service.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { PrioritiesController } from './priorities.controller.js';
import { PrioritiesService } from './priorities.service.js';
import { SectorsController } from './sectors.controller.js';
import { SectorsService } from './sectors.service.js';
import { StatusesController } from './statuses.controller.js';
import { StatusesService } from './statuses.service.js';

@Module({
  controllers: [SectorsController, CategoriesController, StatusesController, PrioritiesController],
  providers: [
    SectorsService,
    CategoriesService,
    StatusesService,
    PrioritiesService,
    CatalogPublicService,
  ],
  exports: [CatalogPublicService],
})
export class CatalogModule {}
