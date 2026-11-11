export const API_BASE_PATH = '/api/v1';
/** X-01: every request has a 15 second limit, treated as a network failure. */
export const REQUEST_TIMEOUT_MS = 15_000;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface FieldErrorDetail {
  field: string;
  code: string;
}

/** Error answered by the API with the single error envelope. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly details: unknown,
    readonly traceId: string | undefined,
  ) {
    super(`API request failed with ${code}`);
    this.name = 'ApiError';
  }

  get fieldErrors(): FieldErrorDetail[] {
    if (!Array.isArray(this.details)) {
      return [];
    }
    return this.details.filter(
      (item): item is FieldErrorDetail =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as FieldErrorDetail).field === 'string' &&
        typeof (item as FieldErrorDetail).code === 'string',
    );
  }
}

/** The request never produced a response: offline, refused, or timed out. */
export class NetworkError extends Error {
  constructor(readonly reason: 'offline' | 'timeout') {
    super(`Network request failed (${reason})`);
    this.name = 'NetworkError';
  }
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registers the global reaction to a 401 (BR1.7): the session provider clears the session. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export type QueryValue = string | number | boolean | undefined;

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Login answers 401 for wrong credentials, which must not end a session. */
  skipUnauthorizedHandler?: boolean;
}

export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return `${API_BASE_PATH}${path}${search ? `?${search}` : ''}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function toApiError(status: number, payload: unknown): ApiError {
  const envelope = (payload as { error?: { code?: unknown; details?: unknown; traceId?: unknown } })
    ?.error;
  if (envelope && typeof envelope.code === 'string') {
    const traceId = typeof envelope.traceId === 'string' ? envelope.traceId : undefined;
    return new ApiError(status, envelope.code, envelope.details, traceId);
  }
  return new ApiError(
    status,
    status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR',
    undefined,
    undefined,
  );
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers: Record<string, string> = { Accept: 'application/json' };
  const init: RequestInit = {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
    headers,
    signal: controller.signal,
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  try {
    let response: Response;
    try {
      response = await fetch(buildUrl(path, options.query), init);
    } catch {
      throw new NetworkError(controller.signal.aborted ? 'timeout' : 'offline');
    }
    const payload = await readJson(response);
    if (!response.ok) {
      if (response.status === 401 && !options.skipUnauthorizedHandler) {
        unauthorizedHandler?.();
      }
      throw toApiError(response.status, payload);
    }
    return payload as T;
  } finally {
    clearTimeout(timer);
  }
}
