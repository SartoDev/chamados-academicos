import { ApiError, apiRequest } from '@/app/api/api-client';
import type { CurrentUser } from '@/app/api/types';

export interface Credentials {
  email: string;
  password: string;
}

/** WF10: the current session, or null when there is none (401). */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await apiRequest<CurrentUser>('/auth/me', { skipUnauthorizedHandler: true });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function login(credentials: Credentials): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/auth/login', {
    method: 'POST',
    body: credentials,
    skipUnauthorizedHandler: true,
  });
}

export async function logout(): Promise<void> {
  await apiRequest<void>('/auth/logout', { method: 'POST', skipUnauthorizedHandler: true });
}
