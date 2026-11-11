import { ApiProperty } from '@nestjs/swagger';
import { ROLES, type Role } from '../../common/roles.js';

export class SectorRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

/** API-U1 `CurrentUser` (response documentation). */
export class CurrentUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: ROLES, enumName: 'Role' })
  role!: Role;

  @ApiProperty({ type: SectorRefDto, nullable: true })
  sector!: SectorRefDto | null;
}
