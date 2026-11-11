import { QueryClient } from '@tanstack/react-query';
import { ApiError, NetworkError } from './api-client';

export const MAX_QUERY_RETRIES = 1;

/**
 * X-01: a query retries at most once, and only after a network failure or a 5xx answer.
 * A 4xx answer is final and goes straight to the error state.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }
  if (error instanceof NetworkError) {
    return true;
  }
  return error instanceof ApiError && error.status >= 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      // Mutations never repeat on their own (X-01).
      mutations: { retry: false },
    },
  });
}
