import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '@/app/api/api-client';
import type { CurrentUser } from '@/app/api/types';
import { fetchCurrentUser, logout } from './auth-api';
import { SESSION_QUERY_KEY, SessionContext, type SessionContextValue } from './use-session';

/** Session in memory (name, role, sector), read from the API when the app opens (WF10). */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [sessionExpired, setSessionExpired] = useState(false);
  const { data, isPending, error, refetch } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
  });

  const clearSession = useCallback(() => {
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== SESSION_QUERY_KEY[0] });
  }, [queryClient]);

  useEffect(() => {
    // BR1.7: a 401 received during use clears the session and leads to the login screen.
    setUnauthorizedHandler(() => {
      if (queryClient.getQueryData(SESSION_QUERY_KEY)) {
        setSessionExpired(true);
      }
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient, clearSession]);

  const signIn = useCallback(
    (user: CurrentUser) => {
      setSessionExpired(false);
      queryClient.setQueryData(SESSION_QUERY_KEY, user);
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch (logoutError) {
      // The local session ends anyway; the cookie then expires on its own (no server state).
      console.warn('Logout request failed', logoutError);
    } finally {
      setSessionExpired(false);
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user: data ?? null,
      isLoading: isPending,
      error,
      sessionExpired,
      retry: () => {
        void refetch();
      },
      signIn,
      signOut,
    }),
    [data, isPending, error, sessionExpired, refetch, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
