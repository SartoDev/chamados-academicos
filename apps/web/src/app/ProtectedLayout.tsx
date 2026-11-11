import { Navigate, Outlet } from 'react-router';
import { useSession } from '@/features/auth/use-session';
import type { Role } from './api/types';
import { AppShell } from './layout/AppShell';
import { AccessDenied, SessionError, SessionLoading } from './StatusPages';

interface ProtectedLayoutProps {
  /** Roles allowed on the nested routes; the real protection stays in the API (BR2.2). */
  allowedRoles?: readonly Role[];
}

/** Requires a session (else login) and, when given, one of the allowed roles. */
export function ProtectedLayout({ allowedRoles }: ProtectedLayoutProps) {
  const { user, isLoading, error, retry, sessionExpired } = useSession();

  if (isLoading) {
    return <SessionLoading />;
  }
  if (!user && error) {
    return <SessionError onRetry={retry} />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ sessionExpired }} />;
  }
  const allowed = !allowedRoles || allowedRoles.includes(user.role);
  return <AppShell>{allowed ? <Outlet /> : <AccessDenied />}</AppShell>;
}
