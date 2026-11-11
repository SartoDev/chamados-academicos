import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '@/app/AppRoutes';
import { SessionProvider } from '@/features/auth/session';
import { LocationProbe } from './LocationProbe';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export type TestRoute = string | { pathname: string; state?: unknown };

interface RenderOptions {
  route?: TestRoute;
  withSession?: boolean;
}

/** Renders with the query cache, an in-memory router and, optionally, the session provider. */
export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const queryClient = createTestQueryClient();
  const user = userEvent.setup();
  const content = options.withSession ? <SessionProvider>{ui}</SessionProvider> : ui;
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>{content}</MemoryRouter>
    </QueryClientProvider>,
  );
  return { user, queryClient, ...result };
}

/** The real routes of the app at a path, with the session read from the mocked API. */
export function renderApp(route: TestRoute) {
  return renderWithProviders(
    <>
      <AppRoutes />
      <LocationProbe />
    </>,
    { route, withSession: true },
  );
}
