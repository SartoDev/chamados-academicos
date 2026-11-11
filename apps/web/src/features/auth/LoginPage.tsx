import { Navigate, useLocation, useNavigate } from 'react-router';
import { entryPathForRole } from '@/app/navigation';
import { LoginForm } from './LoginForm';
import { useSession } from './use-session';

interface LoginLocationState {
  sessionExpired?: boolean;
}

/** Public entry of the system (Tela 1). A signed-in user goes straight to the role entry. */
export function LoginPage() {
  const { user, isLoading, sessionExpired, signIn } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const expiredNotice =
    sessionExpired || (location.state as LoginLocationState | null)?.sessionExpired;

  if (!isLoading && user) {
    return <Navigate to={entryPathForRole(user.role)} replace />;
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background p-4"
    >
      <section className="w-full max-w-sm rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">Chamados Acadêmicos</h1>
        {expiredNotice && (
          <p
            role="status"
            className="mb-4 rounded-md border p-3 text-sm"
            data-testid="login-page-session-expired"
          >
            Sua sessão terminou. Entre novamente.
          </p>
        )}
        <LoginForm
          onSuccess={(current) => {
            signIn(current);
            navigate(entryPathForRole(current.role), { replace: true });
          }}
        />
      </section>
    </main>
  );
}
