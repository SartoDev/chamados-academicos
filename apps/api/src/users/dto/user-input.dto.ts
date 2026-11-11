import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PageQueryDto } from '../../common/http/page-query.dto.js';
import { IsOptionalDefined, ToBoolean, Trim } from '../../common/http/transforms.js';
import { ROLES, type Role } from '../../common/roles.js';
import { IsPasswordPolicy } from '../../common/validation/is-password-policy.decorator.js';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../common/validation/password-policy.js';

const PASSWORD_DESCRIPTION = `${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters, at least one letter and one digit.`;

/** createUser body (BR3.1 to BR3.4). Unknown fields are discarded by the global pipe. */
export class CreateUserDto {
  @ApiProperty({ minLength: 1, maxLength: 120 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ format: 'email', maxLength: 254 })
  @Trim()
  @IsString()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ enum: ROLES, enumName: 'Role' })
  @IsIn(ROLES)
  role!: Role;

  @ApiProperty({ description: PASSWORD_DESCRIPTION })
  @IsPasswordPolicy()
  password!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Required when role is AGENT or MANAGER (USER_SECTOR_REQUIRED).',
  })
  @IsOptional()
  @IsUUID()
  sectorId?: string | null;
}

/** updateUser body: every field optional; a new role, sector or state applies on the next request. */
export class UpdateUserDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 120 })
  @IsOptionalDefined()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: ROLES, enumName: 'Role' })
  @IsOptionalDefined()
  @IsIn(ROLES)
  role?: Role;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  sectorId?: string | null;

  @ApiPropertyOptional()
  @IsOptionalDefined()
  @IsBoolean()
  active?: boolean;
}

export class ResetPasswordDto {
  @ApiProperty({ description: PASSWORD_DESCRIPTION })
  @IsPasswordPolicy()
  password!: string;
}

export class ListUsersQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ROLES, enumName: 'Role' })
  @IsOptional()
  @IsIn(ROLES)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sectorId?: string;
}
