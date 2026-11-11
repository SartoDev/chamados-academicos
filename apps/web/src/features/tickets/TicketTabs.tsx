import type { ReactNode } from 'react';
import type { TicketDetail } from '@/app/api/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketHistoryTab } from './TicketHistoryTab';

export interface TicketTab {
  value: string;
  label: string;
  content: ReactNode;
}

interface TicketTabsProps {
  ticket: TicketDetail;
  /** Extension point: U3 registers the Conversa tab here without touching this file. */
  extraTabs?: readonly TicketTab[];
  /**
   * Extension point of a different shape, created by U5: content rendered inside the Detalhes
   * panel, below the details themselves, instead of a sibling tab. The rating is information
   * about the ticket, not a conversation nor a history, so it belongs in Detalhes and never
   * gets a tab of its own (BR5.1 of U5). Left out, the panel is exactly what it was before.
   */
  detailsExtra?: ReactNode;
}

function TicketDetailsTab({ ticket }: { ticket: TicketDetail }) {
  return (
    <div className="flex flex-col gap-3" data-testid="ticket-details-tab">
      <h2 className="text-lg font-semibold">Descrição</h2>
      <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
    </div>
  );
}

/** BR9.4, BR9.9: tabs navigable with the arrow keys, Detalhes and Histórico in U2. */
export function TicketTabs({ ticket, extraTabs = [], detailsExtra }: TicketTabsProps) {
  return (
    <Tabs defaultValue="details" className="min-w-0">
      <div className="max-w-full overflow-x-auto">
        <TabsList aria-label="Seções do chamado">
          <TabsTrigger value="details" data-testid="ticket-tabs-details-tab">
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="ticket-tabs-history-tab">
            Histórico
          </TabsTrigger>
          {extraTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              data-testid={`ticket-tabs-${tab.value}-tab`}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <TabsContent value="details" className="min-w-0 pt-3">
        <div className="flex min-w-0 flex-col gap-6">
          <TicketDetailsTab ticket={ticket} />
          {detailsExtra}
        </div>
      </TabsContent>
      <TabsContent value="history" className="min-w-0 pt-3">
        <TicketHistoryTab ticketId={ticket.id} />
      </TabsContent>
      {extraTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="min-w-0 pt-3">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
