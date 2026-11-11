import type { Status, TicketCountGroup, TicketCounts } from '@/app/api/types';

/** Order the cards follow on screen, whatever order the catalog answers in (BR7.1). */
export const STATUS_ORDER: readonly Status['key'][] = [
  'OPEN',
  'IN_ANALYSIS',
  'WAITING_REQUESTER',
  'CLOSED',
];

export const EMPTY_PERIOD_MESSAGE = 'Nenhum chamado no período selecionado.';

/**
 * BR7.1: the count omits a group without tickets, so the missing statuses are completed with
 * zero from the catalog of U1, which is also where their names come from.
 */
export function fillStatusCounts(
  statuses: readonly Status[],
  counts: TicketCounts | undefined,
): TicketCountGroup[] {
  const byId = new Map((counts?.groups ?? []).map((group) => [group.id, group.count]));
  return [...statuses]
    .sort((left, right) => STATUS_ORDER.indexOf(left.key) - STATUS_ORDER.indexOf(right.key))
    .map((status) => ({ id: status.id, label: status.label, count: byId.get(status.id) ?? 0 }));
}
