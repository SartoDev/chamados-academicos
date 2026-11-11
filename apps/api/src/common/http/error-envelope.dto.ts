import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';

/** OpenAPI description of the single error envelope (X-01). Documentation only. */
export class FieldErrorDto {
  @ApiProperty({ example: 'email' })
  field!: string;

  @ApiProperty({ example: 'INVALID_EMAIL' })
  code!: string;
}

@ApiExtraModels(FieldErrorDto)
export class ErrorBodyDto {
  @ApiProperty({
    pattern: '^[A-Z][A-Z0-9_]*$',
    description: 'Stable contract; the frontend translates it.',
  })
  code!: string;

  @ApiProperty({ description: 'Debug fallback only; never shown as-is to the user.' })
  message!: string;

  @ApiPropertyOptional({
    description: 'Optional structured detail, e.g. per-field validation codes.',
    oneOf: [{ type: 'array', items: { $ref: getSchemaPath(FieldErrorDto) } }, { type: 'object' }],
  })
  details?: unknown;

  @ApiProperty()
  traceId!: string;
}

export class ErrorEnvelopeDto {
  @ApiProperty({ type: ErrorBodyDto })
  error!: ErrorBodyDto;
}
