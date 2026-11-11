import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ALL_ROLES } from '../auth/actor.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SESSION_COOKIE_NAME } from '../auth/session-cookie.js';
import { ApiErrorResponses } from '../common/http/api-errors.decorator.js';
import { toPageRequest } from '../common/http/page-query.dto.js';
import { uuidParam } from '../common/http/uuid-param.pipe.js';
import type { Page } from '../common/pagination.js';
import type { CategoryView } from './catalog.types.js';
import { CategoriesService } from './categories.service.js';
import {
  CreateCategoryDto,
  ListCategoriesQueryDto,
  UpdateCategoryDto,
} from './dto/catalog-input.dto.js';
import { CategoryDto, CategoryPageDto } from './dto/catalog-response.dto.js';

/** API-U1 categories: read by any authenticated user, written by the administrator (BR2.7). */
@ApiTags('catalog')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({ operationId: 'listCategories' })
  @ApiOkResponse({
    type: CategoryPageDto,
    description: 'Paginated categories, each with its destination sector.',
  })
  @ApiErrorResponses(400, 401)
  list(@Query() query: ListCategoriesQueryDto): Promise<Page<CategoryView>> {
    return this.categories.list(
      { active: query.active, sectorId: query.sectorId, available: query.available },
      toPageRequest(query),
    );
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ operationId: 'createCategory' })
  @ApiCreatedResponse({ type: CategoryDto })
  @ApiErrorResponses(400, 401, 403, 404, 409, 422)
  create(@Body() body: CreateCategoryDto): Promise<CategoryView> {
    return this.categories.create(body);
  }

  @Patch(':categoryId')
  @Roles('ADMIN')
  @ApiOperation({ operationId: 'updateCategory' })
  @ApiOkResponse({ type: CategoryDto })
  @ApiErrorResponses(400, 401, 403, 404, 409, 422)
  update(
    @Param('categoryId', uuidParam('categoryId')) categoryId: string,
    @Body() body: UpdateCategoryDto,
  ): Promise<CategoryView> {
    return this.categories.update(categoryId, body);
  }
}
