import { useCallback, useEffect, useState } from 'react';
import type { CurrentUser, TicketDetail } from '@/app/api/types';
import type { TicketTab } from '@/features/tickets/TicketTabs';
import { ConversationTab } from './ConversationTab';
import { canSeeConversationTab } from './conversation-rules';

export const CONVERSATION_TAB_VALUE = 'conversation';
const DETAILS_TAB_TEST_ID = 'ticket-tabs-details-tab';

interface ConversationTabRegistration {
  /** What the detail hands to the extension point `extraTabs` of U2. */
  tabs: TicketTab[];
  /**
   * Changes when the tab is dropped, so the detail remounts the tab strip and its selection
   * falls back to Detalhes. The tab strip of U2 is uncontrolled and exposes no value, and
   * dropping the active tab would otherwise leave nothing selected.
   */
  tabsKey: string;
}

/**
 * BR5.1: registers the Conversa tab for the requester of the ticket and for every agent and
 * manager, never for the administrator, and removes it when the first read answers 404 —
 * putting the reading focus back on Detalhes.
 */
export function useConversationTab(
  ticket: TicketDetail | undefined,
  user: CurrentUser | null,
): ConversationTabRegistration {
  const ticketId = ticket?.id;
  // Which ticket the tab was dropped for, so opening another ticket offers it again without a
  // reset step: the flag is derived from the ticket on screen instead of being stored apart.
  const [droppedFor, setDroppedFor] = useState<string | null>(null);
  const dropped = ticketId !== undefined && droppedFor === ticketId;

  useEffect(() => {
    if (!dropped) {
      return;
    }
    // The tab the actor was reading no longer exists; the tab strip has just been remounted on
    // Detalhes, so the focus follows it instead of being lost on the document body (AC5.3.1).
    document.querySelector<HTMLElement>(`[data-testid="${DETAILS_TAB_TEST_ID}"]`)?.focus();
  }, [dropped]);

  const handleUnavailable = useCallback(() => setDroppedFor(ticketId ?? null), [ticketId]);

  const offered =
    ticket !== undefined && user !== null && !dropped && canSeeConversationTab(user, ticket);

  return {
    tabs:
      offered && ticket && user
        ? [
            {
              value: CONVERSATION_TAB_VALUE,
              label: 'Conversa',
              content: (
                <ConversationTab ticket={ticket} user={user} onUnavailable={handleUnavailable} />
              ),
            },
          ]
        : [],
    tabsKey: `${ticketId ?? ''}:${dropped ? 'without-conversation' : 'with-conversation'}`,
  };
}
