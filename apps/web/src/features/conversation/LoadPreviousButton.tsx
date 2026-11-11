import { Button } from '@/components/ui/button';

interface LoadPreviousButtonProps {
  hasPrevious: boolean;
  loading: boolean;
  onLoad: () => void;
}

/** BR5.4: older messages are fetched on demand, from the top of the conversation. */
export function LoadPreviousButton({ hasPrevious, loading, onLoad }: LoadPreviousButtonProps) {
  if (!hasPrevious) {
    return null;
  }
  return (
    <div className="flex justify-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={onLoad}
        data-testid="conversation-load-previous-button"
      >
        {loading ? 'Carregando...' : 'Carregar mensagens anteriores'}
      </Button>
    </div>
  );
}
