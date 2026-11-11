import type { TicketStatusAction } from '../tickets-api';

export interface ConfirmableAction {
  action: TicketStatusAction;
  /** Text of the button that opens the confirmation. */
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
}

/** BR9.4: closing, waiting for the requester and reopening are confirmed before they are sent. */
export const CONFIRMABLE_ACTIONS: Record<
  'wait-for-requester' | 'close' | 'reopen',
  ConfirmableAction
> = {
  'wait-for-requester': {
    action: 'wait-for-requester',
    label: 'Aguardar solicitante',
    title: 'Marcar como aguardando o solicitante?',
    description:
      'O chamado fica aguardando a resposta do solicitante, que é avisado da mudança. Ele volta para Em análise assim que o solicitante responder.',
    confirmLabel: 'Marcar',
  },
  close: {
    action: 'close',
    label: 'Encerrar',
    title: 'Encerrar este chamado?',
    description:
      'O chamado passa para Encerrado. O solicitante pode reabri-lo em até 72 horas a partir do encerramento.',
    confirmLabel: 'Encerrar',
  },
  reopen: {
    action: 'reopen',
    label: 'Reabrir',
    title: 'Reabrir este chamado?',
    description:
      'O chamado volta para Aberto e mantém o último responsável, que é avisado da reabertura.',
    confirmLabel: 'Reabrir',
  },
};
