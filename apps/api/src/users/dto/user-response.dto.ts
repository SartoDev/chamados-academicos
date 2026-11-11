import { ApiProperty } from '@nestjs/swagger';
import { SectorRefDto } from '../../auth/dto/current-user.dto.js';
import { ROLES, type Role } from '../../common/roles.js';

/** API-U1 `User` (response documentation). The password never appears. */
export class UserDto {
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

  @ApiProperty()
  active!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class UserPageDto {
  @ApiProperty({ type: [UserDto] })
  items!: UserDto[];

  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  pageSize!: number;
}
