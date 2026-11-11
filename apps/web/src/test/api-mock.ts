import { vi } from 'vitest';

export interface RecordedRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}

export interface MockAnswer {
  status?: number;
  body?: unknown;
}

export type MockHandler =
  MockAnswer | ((request: RecordedRequest) => MockAnswer | Promise<MockAnswer>);

export function jsonResponse(status: number, body?: unknown): Response {
  const hasBody = body !== undefined && status !== 204;
  return new Response(hasBody ? JSON.stringify(body) : null, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorBody(code: string, details?: unknown, traceId = 'trace-test') {
  return { error: { code, message: code, details, traceId } };
}

/**
 * Replaces fetch with answers keyed by "METHOD /path" (path without /api/v1). Components never
 * reach a real API. Handlers can be swapped during a test through the returned `routes`.
 */
export function mockApi(routes: Record<string, MockHandler>) {
  const calls: RecordedRequest[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const request: RecordedRequest = {
      method: (init?.method ?? 'GET').toUpperCase(),
      path: url.pathname.replace(/^\/api\/v1/, ''),
      query: url.searchParams,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(request);
    const handler = routes[`${request.method} ${request.path}`];
    if (!handler) {
      return jsonResponse(404, errorBody('NOT_FOUND'));
    }
    const answer = typeof handler === 'function' ? await handler(request) : handler;
    return jsonResponse(answer.status ?? 200, answer.body);
  });
  vi.stubGlobal('fetch', fetchMock);
  return {
    fetchMock,
    calls,
    routes,
    callsTo: (method: string, path: string) =>
      calls.filter((call) => call.method === method && call.path === path),
  };
}
