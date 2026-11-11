import { Link, Navigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/features/auth/use-session';
import { entryPathForRole } from './navigation';

/** Sends a signed-in user from "/" to the entry screen of the role (BR7.3). */
export function EntryRedirect() {
  const { user } = useSession();
  return <Navigate to={user ? entryPathForRole(user.role) : '/login'} replace />;
}

export function AccessDenied() {
  return (
    <section role="alert" className="flex flex-col gap-2" data-testid="access-denied">
      <h1 className="text-xl font-semibold">Acesso negado</h1>
      <p className="text-sm">Você não tem permissão para acessar esta página.</p>
    </section>
  );
}

export function SessionLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-3 p-6"
      data-testid="session-loading"
    >
      <span className="sr-only">Carregando...</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function SessionError({ onRetry }: { onRetry: () => void }) {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center p-4">
      <div role="alert" className="flex max-w-sm flex-col items-start gap-3 rounded-md border p-4">
        <p className="text-sm">Não foi possível verificar sua sessão.</p>
        <Button variant="outline" onClick={onRetry} data-testid="session-error-retry-button">
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-3 p-4"
    >
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <Link
        to="/"
        className="text-sm underline underline-offset-4"
        data-testid="not-found-home-link"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
