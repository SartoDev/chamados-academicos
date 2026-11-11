import type { NotificationKind } from '@/app/api/types';

/** What each event means for the recipient, in Portuguese (CT11, wireframes Tela 7). */
export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, string> = {
  MESSAGE_RECEIVED: 'Nova mensagem no chamado',
  STATUS_CHANGED: 'O status do chamado mudou',
  ASSIGNEE_CHANGED: 'O responsável pelo chamado mudou',
  SECTOR_CHANGED: 'O chamado foi transferido de setor',
  TICKET_REOPENED: 'O chamado foi reaberto',
};
