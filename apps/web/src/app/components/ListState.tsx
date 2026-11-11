import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ListStatus } from './list-status';

interface ListStateProps {
  status: ListStatus;
  emptyMessage: string;
  errorMessage: string;
  onRetry: () => void;
  skeletonRows?: number;
  children?: ReactNode;
}

/** BR7.4, CT7: skeleton while loading, explanatory empty state, error with retry. */
export function ListState({
  status,
  emptyMessage,
  errorMessage,
  onRetry,
  skeletonRows = 5,
  children,
}: ListStateProps) {
  if (status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col gap-2"
        data-testid="list-state-loading"
      >
        <span className="sr-only">Carregando...</span>
        {Array.from({ length: skeletonRows }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-md border p-4"
        data-testid="list-state-error"
      >
        <p className="text-sm">{errorMessage}</p>
        <Button variant="outline" onClick={onRetry} data-testid="list-state-retry-button">
          Tentar novamente
        </Button>
      </div>
    );
  }
  if (status === 'empty') {
    return (
      <p
        className="rounded-md border p-4 text-sm text-muted-foreground"
        data-testid="list-state-empty"
      >
        {emptyMessage}
      </p>
    );
  }
  return <>{children}</>;
}
