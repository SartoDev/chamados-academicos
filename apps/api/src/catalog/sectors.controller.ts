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
import type { SectorView } from './catalog.types.js';
import { CreateSectorDto, ListSectorsQueryDto, UpdateSectorDto } from './dto/catalog-input.dto.js';
import { SectorDto, SectorPageDto } from './dto/catalog-response.dto.js';
import { SectorsService } from './sectors.service.js';

/** API-U1 sectors: read by any authenticated user, written by the administrator (BR2.7). */
@ApiTags('catalog')
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectors: SectorsService) {}

  @Get()
  @Roles(...ALL_ROLES)
  @ApiOperation({ operationId: 'listSectors' })
  @ApiOkResponse({ type: SectorPageDto })
  @ApiErrorResponses(400, 401)
  list(@Query() query: ListSectorsQueryDto): Promise<Page<SectorView>> {
    return this.sectors.list({ active: query.active }, toPageRequest(query));
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ operationId: 'createSector' })
  @ApiCreatedResponse({ type: SectorDto })
  @ApiErrorResponses(400, 401, 403, 409)
  create(@Body() body: CreateSectorDto): Promise<SectorView> {
    return this.sectors.create(body);
  }

  @Patch(':sectorId')
  @Roles('ADMIN')
  @ApiOperation({ operationId: 'updateSector' })
  @ApiOkResponse({ type: SectorDto, description: 'Deactivation does not change existing tickets.' })
  @ApiErrorResponses(400, 401, 403, 404, 409)
  update(
    @Param('sectorId', uuidParam('sectorId')) sectorId: string,
    @Body() body: UpdateSectorDto,
  ): Promise<SectorView> {
    return this.sectors.update(sectorId, body);
  }
}
