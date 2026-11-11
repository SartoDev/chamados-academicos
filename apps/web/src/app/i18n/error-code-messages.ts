import { ApiError, NetworkError } from '../api/api-client';

/** BR7.5, CT11: Portuguese text for every error code produced by U1. */
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  VALIDATION_FAILED: 'Alguns campos estão inválidos. Revise e tente novamente.',
  UNAUTHENTICATED: 'Sua sessão terminou. Entre novamente.',
  FORBIDDEN: 'Você não tem permissão para realizar esta ação.',
  NOT_FOUND: 'O item solicitado não foi encontrado.',
  INTERNAL_ERROR: 'Ocorreu um erro inesperado. Tente novamente em instantes.',
  AUTH_INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  AUTH_TOO_MANY_ATTEMPTS: 'Muitas tentativas de entrada. Aguarde alguns minutos e tente novamente.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
  USER_EMAIL_TAKEN: 'Já existe um usuário com este e-mail.',
  USER_SECTOR_REQUIRED: 'Atendentes e gestores precisam estar vinculados a um setor.',
  USER_SELF_MODIFICATION_FORBIDDEN:
    'Você não pode desativar a própria conta nem remover de si o perfil de administrador.',
  USER_LAST_ACTIVE_ADMIN:
    'Não é possível desativar ou rebaixar o último administrador ativo do sistema.',
  CATALOG_ITEM_NOT_FOUND: 'O item de catálogo não foi encontrado.',
  CATALOG_ITEM_INACTIVE: 'O item escolhido está inativo. Escolha um item ativo.',
  CATALOG_NAME_TAKEN: 'Já existe um item com este nome.',
  CATALOG_DEFAULT_PRIORITY_REQUIRED: 'É preciso manter sempre uma prioridade padrão ativa.',
  // U2 — chamados e notificações (CT11).
  TICKET_NOT_FOUND: 'Chamado não encontrado.',
  TICKET_INVALID_TRANSITION:
    'Esta mudança não é possível na situação atual do chamado. Atualize a página e tente novamente.',
  TICKET_ALREADY_ASSIGNED: 'Este chamado já tem um responsável.',
  TICKET_REOPEN_WINDOW_EXPIRED:
    'O prazo de 72 horas para reabrir este chamado, contado do encerramento, já passou.',
  TICKET_CLOSED: 'Este chamado está encerrado e não aceita esta ação.',
  TICKET_ASSIGNEE_NOT_IN_SECTOR:
    'A pessoa escolhida não pode receber chamados deste setor. Escolha alguém do setor atual.',
  TICKET_TRANSFER_SAME_SECTOR: 'Escolha um setor diferente do setor atual do chamado.',
  TICKET_QUEUE_NO_SECTOR:
    'Seu usuário não está vinculado a um setor. Peça a um administrador para vincular você a um setor.',
  NOTIFICATION_NOT_FOUND: 'Notificação não encontrada.',
  // U3 — conversa (CT11).
  MESSAGE_TICKET_CLOSED: 'Este chamado está encerrado e não aceita novas mensagens.',
  // U5 — avaliação (CT11, BR5.6).
  RATING_NOT_FOUND: 'Este chamado ainda não foi avaliado.',
  RATING_TICKET_NOT_CLOSED:
    'Este chamado não está encerrado. Só é possível avaliar depois do encerramento.',
  RATING_ALREADY_EXISTS:
    'Este chamado já foi avaliado. A avaliação é definitiva e não pode ser alterada.',
};

/** Field codes sent in `error.details` (BR6.3). */
export const FIELD_CODE_MESSAGES: Record<string, string> = {
  REQUIRED: 'Campo obrigatório.',
  INVALID_STRING: 'Valor inválido.',
  INVALID_EMAIL: 'Informe um e-mail válido.',
  TOO_SHORT: 'Texto menor que o permitido.',
  TOO_LONG: 'Texto maior que o permitido.',
  INVALID_VALUE: 'Escolha uma opção válida.',
  INVALID_UUID: 'Escolha uma opção válida.',
  INVALID_BOOLEAN: 'Valor inválido.',
  INVALID_INTEGER: 'Informe um número inteiro.',
  OUT_OF_RANGE: 'Valor fora do intervalo permitido.',
  PASSWORD_TOO_SHORT: 'A senha deve ter pelo menos 8 caracteres.',
  PASSWORD_TOO_LONG: 'A senha deve ter no máximo 128 caracteres.',
  PASSWORD_MISSING_LETTER: 'A senha deve ter ao menos uma letra.',
  PASSWORD_MISSING_DIGIT: 'A senha deve ter ao menos um algarismo.',
};

const GENERIC_MESSAGE = 'Ocorreu um erro inesperado.';

function retryAfterMinutes(details: unknown): number | null {
  const seconds = (details as { retryAfterSeconds?: unknown } | undefined)?.retryAfterSeconds;
  return typeof seconds === 'number' && seconds > 0 ? Math.ceil(seconds / 60) : null;
}

/** BR3.1: the refusal to take a ticket names whoever is responsible for it (AC2.2.2). */
function currentAssigneeName(details: unknown): string | null {
  const assignee = (details as { assignee?: { name?: unknown } } | undefined)?.assignee;
  const name = assignee?.name;
  return typeof name === 'string' && name.trim().length > 0 ? name : null;
}

/** Text shown to the user for any failure of an API call. */
export function messageForError(error: unknown): string {
  if (error instanceof NetworkError) {
    return error.reason === 'timeout'
      ? 'O servidor demorou para responder. Tente novamente.'
      : 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }
  if (!(error instanceof ApiError)) {
    return GENERIC_MESSAGE;
  }
  if (error.code === 'AUTH_TOO_MANY_ATTEMPTS') {
    const minutes = retryAfterMinutes(error.details);
    if (minutes !== null) {
      const unit = minutes === 1 ? 'minuto' : 'minutos';
      return `Muitas tentativas de entrada. Tente novamente em ${minutes} ${unit}.`;
    }
  }
  if (error.code === 'TICKET_ALREADY_ASSIGNED') {
    const assigneeName = currentAssigneeName(error.details);
    if (assigneeName) {
      return `Este chamado já foi assumido por ${assigneeName}.`;
    }
  }
  const known = ERROR_CODE_MESSAGES[error.code];
  if (known) {
    return known;
  }
  return error.traceId
    ? `${GENERIC_MESSAGE} Código de rastreio: ${error.traceId}.`
    : GENERIC_MESSAGE;
}

export function messageForFieldCode(code: string): string {
  return FIELD_CODE_MESSAGES[code] ?? 'Valor inválido.';
}
