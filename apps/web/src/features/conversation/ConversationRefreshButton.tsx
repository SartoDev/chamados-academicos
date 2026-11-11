import { Button } from '@/components/ui/button';

interface ConversationRefreshButtonProps {
  refreshing: boolean;
  onRefresh: () => void;
}

/** BR5.5: the conversation never updates on its own; this is how the actor asks for it. */
export function ConversationRefreshButton({
  refreshing,
  onRefresh,
}: ConversationRefreshButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={refreshing}
      onClick={onRefresh}
      data-testid="conversation-refresh-button"
    >
      {refreshing ? 'Atualizando...' : 'Atualizar'}
    </Button>
  );
}
