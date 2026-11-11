import { ApiProperty } from '@nestjs/swagger';
import { SectorRefDto } from '../../auth/dto/current-user.dto.js';
import { STATUS_KEYS, type StatusKeyValue } from '../catalog.types.js';

/** API-U1 catalog response schemas (documentation only). */
class PageMetaDto {
  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  pageSize!: number;
}

export class SectorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  active!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class SectorPageDto extends PageMetaDto {
  @ApiProperty({ type: [SectorDto] })
  items!: SectorDto[];
}

export class CategoryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: SectorRefDto })
  sector!: SectorRefDto;

  @ApiProperty()
  active!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class CategoryPageDto extends PageMetaDto {
  @ApiProperty({ type: [CategoryDto] })
  items!: CategoryDto[];
}

/** Divergence from the initial contract (Q3): statuses have no `active` field. */
export class StatusDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: STATUS_KEYS, enumName: 'StatusKey' })
  key!: StatusKeyValue;

  @ApiProperty()
  label!: string;
}

export class StatusPageDto extends PageMetaDto {
  @ApiProperty({ type: [StatusDto] })
  items!: StatusDto[];
}

export class PriorityDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty()
  active!: boolean;
}

export class PriorityPageDto extends PageMetaDto {
  @ApiProperty({ type: [PriorityDto] })
  items!: PriorityDto[];
}
