import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorEnvelopeDto } from './error-envelope.dto.js';

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED or AUTH_INVALID_CREDENTIALS',
  403: 'FORBIDDEN',
  404: 'Resource missing or invisible to the actor',
  409: 'Domain code for a state conflict',
  422: 'Domain code for a business-rule violation',
  429: 'AUTH_TOO_MANY_ATTEMPTS, with Retry-After',
};

/** Documents error responses of an operation with the single error envelope. */
export function ApiErrorResponses(...statuses: number[]): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({ status, description: ERROR_DESCRIPTIONS[status], type: ErrorEnvelopeDto }),
    ),
  );
}
