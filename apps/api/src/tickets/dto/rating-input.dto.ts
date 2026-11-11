import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Trim } from '../../common/http/transforms.js';
import {
  RATING_COMMENT_MAX_LENGTH,
  RATING_MAX_SCORE,
  RATING_MIN_SCORE,
} from '../rules/rating-score.js';

/**
 * `rateTicket` body (BR2.1, BR2.2). The scale and the comment limit come from the pure rule
 * module, so the DTO and the service can never disagree about them. A comment that is only
 * blank space arrives here as an empty string and is stored as absent by the service.
 */
export class RateTicketDto {
  @ApiProperty({
    type: Number,
    minimum: RATING_MIN_SCORE,
    maximum: RATING_MAX_SCORE,
    description: 'Integer of the fixed scale; each value has a label shown by the web app.',
  })
  @IsInt()
  @Min(RATING_MIN_SCORE)
  @Max(RATING_MAX_SCORE)
  score!: number;

  @ApiPropertyOptional({
    maxLength: RATING_COMMENT_MAX_LENGTH,
    description:
      'Optional plain text; surrounding blank space is removed and an empty result is stored as absent.',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(RATING_COMMENT_MAX_LENGTH)
  comment?: string;
}
