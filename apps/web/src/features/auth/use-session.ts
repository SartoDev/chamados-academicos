import { createContext, useContext } from 'react';
import type { CurrentUser } from '@/app/api/types';

export const SESSION_QUERY_KEY = ['session'] as const;

export interface SessionContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  error: unknown;
  /** True after a 401 ended a session that was in use (shown on the login screen). */
  sessionExpired: boolean;
  retry: () => void;
  signIn: (user: CurrentUser) => void;
  signOut: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return context;
}
