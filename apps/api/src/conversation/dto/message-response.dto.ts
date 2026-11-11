import { ApiProperty } from '@nestjs/swagger';

/** API-U3 response schemas (documentation only). */
class MessagePageMetaDto {
  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  pageSize!: number;
}

export class MessageAuthorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Resolved when read, including deactivated users (BR3.3).' })
  name!: string;
}

export class MessageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Plain text; line breaks are kept and no markup is interpreted.' })
  body!: string;

  @ApiProperty({ type: MessageAuthorDto })
  author!: MessageAuthorDto;

  @ApiProperty({ format: 'date-time' })
  sentAt!: string;
}

export class MessagePageDto extends MessagePageMetaDto {
  @ApiProperty({ type: [MessageDto] })
  items!: MessageDto[];
}
