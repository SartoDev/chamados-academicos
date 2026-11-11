import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorBody, mockApi } from '@/test/api-mock';
import {
  ApiError,
  apiRequest,
  buildUrl,
  NetworkError,
  REQUEST_TIMEOUT_MS,
  setUnauthorizedHandler,
} from './api-client';

describe('apiRequest (X-01)', () => {
  afterEach(() => {
    setUnauthorizedHandler(null);
    vi.useRealTimers();
  });

  it('builds URLs under /api/v1 and skips empty query values', () => {
    expect(buildUrl('/users', { page: 2, role: undefined, active: false, sectorId: '' })).toBe(
      '/api/v1/users?page=2&active=false',
    );
    expect(buildUrl('/auth/me')).toBe('/api/v1/auth/me');
  });

  it('sends JSON with same-origin credentials and returns the body', async () => {
    const api = mockApi({
      'POST /sectors': { status: 201, body: { id: 's1', name: 'Secretaria' } },
    });

    const result = await apiRequest('/sectors', { method: 'POST', body: { name: 'Secretaria' } });

    expect(result).toEqual({ id: 's1', name: 'Secretaria' });
    expect(api.fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
    expect(api.calls[0]?.body).toEqual({ name: 'Secretaria' });
  });

  it('returns undefined for a 204 answer', async () => {
    mockApi({ 'POST /auth/logout': { status: 204 } });

    await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('turns the error envelope into an ApiError with its field errors', async () => {
    mockApi({
      'POST /users': {
        status: 400,
        body: errorBody(
          'VALIDATION_FAILED',
          [{ field: 'email', code: 'INVALID_EMAIL' }, { nope: 1 }],
          't-1',
        ),
      },
    });

    const error = await apiRequest('/users', { method: 'POST', body: {} }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_FAILED', traceId: 't-1' });
    expect((error as ApiError).fieldErrors).toEqual([{ field: 'email', code: 'INVALID_EMAIL' }]);
  });

  it('uses generic codes when the answer is not an envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('<html>bad gateway</html>', { status: 502 }))
        .mockResolvedValueOnce(new Response('', { status: 418 })),
    );

    const gateway = (await apiRequest('/users').catch((e: unknown) => e)) as ApiError;
    const teapot = (await apiRequest('/users').catch((e: unknown) => e)) as ApiError;

    expect(gateway).toMatchObject({ code: 'INTERNAL_ERROR', traceId: undefined });
    expect(teapot.code).toBe('UNKNOWN_ERROR');
    expect(teapot.fieldErrors).toEqual([]);
  });

  it('notifies the unauthorized handler on 401 unless the request opts out (BR1.7)', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    mockApi({
      'GET /users': { status: 401, body: errorBody('UNAUTHENTICATED') },
      'POST /auth/login': { status: 401, body: errorBody('AUTH_INVALID_CREDENTIALS') },
    });

    await expect(apiRequest('/users')).rejects.toBeInstanceOf(ApiError);
    await expect(
      apiRequest('/auth/login', { method: 'POST', body: {}, skipUnauthorizedHandler: true }),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('reports a request that never got an answer as an offline network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiRequest('/users')).rejects.toMatchObject({
      name: 'NetworkError',
      reason: 'offline',
    });
  });

  it('gives up after 15 seconds and reports a timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      ),
    );

    const outcome = apiRequest('/users').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);

    const error = await outcome;
    expect(error).toBeInstanceOf(NetworkError);
    expect((error as NetworkError).reason).toBe('timeout');
  });
});
