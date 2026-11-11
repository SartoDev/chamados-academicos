import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../common/http/page-query.dto.js';
import { IsOptionalDefined, ToBoolean, Trim } from '../../common/http/transforms.js';

const NAME_MAX_LENGTH = 80;
const LABEL_MAX_LENGTH = 40;

/** Bodies and queries of the catalog operations (BR4.1, BR4.2, BR4.6, BR4.7). */
export class CreateSectorDto {
  @ApiProperty({ minLength: 1, maxLength: NAME_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name!: string;
}

export class UpdateSectorDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: NAME_MAX_LENGTH })
  @IsOptionalDefined()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({ description: 'Deactivation does not change existing records.' })
  @IsOptionalDefined()
  @IsBoolean()
  active?: boolean;
}

export class ListSectorsQueryDto extends PageQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  active?: boolean;
}

export class CreateCategoryDto {
  @ApiProperty({ minLength: 1, maxLength: NAME_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sectorId!: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: NAME_MAX_LENGTH })
  @IsOptionalDefined()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptionalDefined()
  @IsUUID()
  sectorId?: string;

  @ApiPropertyOptional()
  @IsOptionalDefined()
  @IsBoolean()
  active?: boolean;
}

export class ListCategoriesQueryDto extends PageQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sectorId?: string;

  @ApiPropertyOptional({
    description:
      'Additive filter (BR4.4): true lists only categories offered for new tickets, i.e. the category and its sector are active.',
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  available?: boolean;
}

/** updateStatus body: only the label. A key or active field sent is discarded (BR4.6). */
export class UpdateStatusDto {
  @ApiProperty({ minLength: 1, maxLength: LABEL_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(LABEL_MAX_LENGTH)
  label!: string;
}

export class CreatePriorityDto {
  @ApiProperty({ minLength: 1, maxLength: LABEL_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(LABEL_MAX_LENGTH)
  label!: string;

  @ApiPropertyOptional()
  @IsOptionalDefined()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePriorityDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: LABEL_MAX_LENGTH })
  @IsOptionalDefined()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(LABEL_MAX_LENGTH)
  label?: string;

  @ApiPropertyOptional({
    description: 'Marking as default removes the mark from the previous one.',
  })
  @IsOptionalDefined()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptionalDefined()
  @IsBoolean()
  active?: boolean;
}

export class ListPrioritiesQueryDto extends PageQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  active?: boolean;
}
