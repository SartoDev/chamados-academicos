import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from './api-client';
import { createQueryClient, MAX_QUERY_RETRIES, shouldRetryQuery } from './query-client';

describe('query retry policy (X-01)', () => {
  it('retries a query once after a network failure or a 5xx answer', () => {
    expect(shouldRetryQuery(0, new NetworkError('offline'))).toBe(true);
    expect(shouldRetryQuery(0, new NetworkError('timeout'))).toBe(true);
    expect(shouldRetryQuery(0, new ApiError(503, 'INTERNAL_ERROR', undefined, 't'))).toBe(true);
  });

  it('never retries more than once', () => {
    expect(shouldRetryQuery(MAX_QUERY_RETRIES, new NetworkError('offline'))).toBe(false);
  });

  it('never retries a 4xx answer or an unknown failure', () => {
    expect(shouldRetryQuery(0, new ApiError(404, 'NOT_FOUND', undefined, 't'))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError(403, 'FORBIDDEN', undefined, 't'))).toBe(false);
    expect(shouldRetryQuery(0, new Error('bug'))).toBe(false);
  });

  it('configures queries with the policy and mutations without retries', () => {
    const options = createQueryClient().getDefaultOptions();

    expect(options.queries?.retry).toBe(shouldRetryQuery);
    expect(options.queries?.refetchOnWindowFocus).toBe(false);
    expect(options.mutations?.retry).toBe(false);
  });
});
