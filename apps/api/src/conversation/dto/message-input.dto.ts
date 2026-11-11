import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { PageQueryDto } from '../../common/http/page-query.dto.js';
import { Trim } from '../../common/http/transforms.js';
import {
  DEFAULT_MESSAGE_ORDER,
  MESSAGE_BODY_MAX_LENGTH,
  MESSAGE_BODY_MIN_LENGTH,
  MESSAGE_ORDERS,
  type MessageOrder,
} from '../conversation.types.js';

/**
 * `listMessages` parameters. `order` is the additive parameter of U3 (BR3.2): `sort` is omitted
 * because `sentAt` is the only sortable field of the conversation.
 */
export class ListMessagesQueryDto extends PageQueryDto {
  @ApiPropertyOptional({
    enum: MESSAGE_ORDERS,
    default: DEFAULT_MESSAGE_ORDER,
    description:
      'Chronological by default; desc brings the most recent page first, which the tab shows reversed.',
  })
  @IsIn(MESSAGE_ORDERS)
  order: MessageOrder = DEFAULT_MESSAGE_ORDER;
}

/** `sendMessage` body (BR2.1). Plain text, surrounding blank space removed before validating. */
export class SendMessageDto {
  @ApiProperty({ minLength: MESSAGE_BODY_MIN_LENGTH, maxLength: MESSAGE_BODY_MAX_LENGTH })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MinLength(MESSAGE_BODY_MIN_LENGTH)
  @MaxLength(MESSAGE_BODY_MAX_LENGTH)
  body!: string;
}
