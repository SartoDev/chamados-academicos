import { ApiProperty } from '@nestjs/swagger';
import { RATING_MAX_SCORE, RATING_MIN_SCORE } from '../rules/rating-score.js';

/** API-U5 `Rating` (documentation only). Written once and never updated (BR2.3). */
export class RatingDto {
  @ApiProperty({ format: 'uuid' })
  ticketId!: string;

  @ApiProperty({ minimum: RATING_MIN_SCORE, maximum: RATING_MAX_SCORE })
  score!: number;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Plain text with the line breaks preserved; empty when none was written.',
  })
  comment!: string | null;

  @ApiProperty({ format: 'date-time' })
  ratedAt!: string;
}
