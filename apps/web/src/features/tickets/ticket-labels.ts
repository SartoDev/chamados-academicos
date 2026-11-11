import type { QueueSlice, TicketHistoryField, TicketSortField } from '@/app/api/types';

/** Portuguese labels of the values the API speaks in stable keys (CT11). */
export const QUEUE_SLICE_LABELS: Record<QueueSlice, string> = {
  unassigned: 'Não atribuídos',
  mine: 'Meus',
  all: 'Todos',
  passed: 'Passaram pelo setor',
};

export const QUEUE_SLICES: readonly QueueSlice[] = ['unassigned', 'mine', 'all', 'passed'];

export const HISTORY_FIELD_LABELS: Record<TicketHistoryField, string> = {
  STATUS: 'Status',
  ASSIGNEE: 'Responsável',
  SECTOR: 'Setor',
  PRIORITY: 'Prioridade',
};

export interface SortOption {
  value: string;
  label: string;
  sort: TicketSortField;
  order: 'asc' | 'desc';
}

export const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'updatedAt-desc', label: 'Atualizado recentemente', sort: 'updatedAt', order: 'desc' },
  { value: 'updatedAt-asc', label: 'Atualizado há mais tempo', sort: 'updatedAt', order: 'asc' },
  { value: 'openedAt-desc', label: 'Aberto recentemente', sort: 'openedAt', order: 'desc' },
  { value: 'openedAt-asc', label: 'Aberto há mais tempo', sort: 'openedAt', order: 'asc' },
  { value: 'reference-desc', label: 'Número, do maior', sort: 'reference', order: 'desc' },
  { value: 'reference-asc', label: 'Número, do menor', sort: 'reference', order: 'asc' },
];

export const DEFAULT_SORT_OPTION = SORT_OPTIONS[0] as SortOption;

export function sortOptionOf(value: string): SortOption {
  return SORT_OPTIONS.find((option) => option.value === value) ?? DEFAULT_SORT_OPTION;
}

/** Empty state of each slice of the queue (BR9.5, wireframes Tela 6). */
export const QUEUE_EMPTY_MESSAGES: Record<QueueSlice, string> = {
  unassigned: 'Todos os chamados já têm responsável.',
  mine: 'Você não tem chamados atribuídos a você neste setor.',
  all: 'Nenhum chamado na fila deste setor.',
  passed: 'Nenhum chamado que passou por este setor está em outro setor.',
};
