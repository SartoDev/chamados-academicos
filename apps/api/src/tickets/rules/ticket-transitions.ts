/**
 * Transition machine of the ticket status (BR4.1, ADR-006, M2). Pure module: it knows nothing
 * about NestJS, about Prisma or about the database, and decides only from the stable status key
 * and the action that was requested.
 */
export const TICKET_STATUS_KEYS = ['OPEN', 'IN_ANALYSIS', 'WAITING_REQUESTER', 'CLOSED'] as const;

export type TicketStatusKey = (typeof TICKET_STATUS_KEYS)[number];

export const TICKET_TRANSITION_ACTIONS = [
  'ASSUME',
  'ASSIGN',
  'WAIT_FOR_REQUESTER',
  'REQUESTER_MESSAGE',
  'TRANSFER',
  'CLOSE',
  'REOPEN',
] as const;

export type TicketTransitionAction = (typeof TICKET_TRANSITION_ACTIONS)[number];

export interface StatusTransition {
  from: TicketStatusKey;
  to: TicketStatusKey;
  action: TicketTransitionAction;
}

/**
 * The nine valid transitions of stories.md. Assuming and assigning share the same status pair,
 * so nine pairs are written as ten rows, one per action that triggers them.
 */
export const VALID_TRANSITIONS: readonly StatusTransition[] = [
  { from: 'OPEN', to: 'IN_ANALYSIS', action: 'ASSUME' },
  { from: 'OPEN', to: 'IN_ANALYSIS', action: 'ASSIGN' },
  { from: 'IN_ANALYSIS', to: 'WAITING_REQUESTER', action: 'WAIT_FOR_REQUESTER' },
  { from: 'WAITING_REQUESTER', to: 'IN_ANALYSIS', action: 'REQUESTER_MESSAGE' },
  { from: 'IN_ANALYSIS', to: 'OPEN', action: 'TRANSFER' },
  { from: 'WAITING_REQUESTER', to: 'OPEN', action: 'TRANSFER' },
  { from: 'OPEN', to: 'CLOSED', action: 'CLOSE' },
  { from: 'IN_ANALYSIS', to: 'CLOSED', action: 'CLOSE' },
  { from: 'WAITING_REQUESTER', to: 'CLOSED', action: 'CLOSE' },
  { from: 'CLOSED', to: 'OPEN', action: 'REOPEN' },
];

/**
 * Actions allowed without any status change: taking over or reassigning a ticket already in
 * analysis or waiting for the requester, and transferring a ticket that is still open (BR3.1,
 * BR3.2, BR4.1).
 */
const UNCHANGED_COMBINATIONS: ReadonlyArray<{
  status: TicketStatusKey;
  action: TicketTransitionAction;
}> = [
  { status: 'IN_ANALYSIS', action: 'ASSUME' },
  { status: 'WAITING_REQUESTER', action: 'ASSUME' },
  { status: 'IN_ANALYSIS', action: 'ASSIGN' },
  { status: 'WAITING_REQUESTER', action: 'ASSIGN' },
  { status: 'OPEN', action: 'TRANSFER' },
];

export type TransitionResult =
  /** The status changes from one key to another. */
  | { kind: 'transition'; from: TicketStatusKey; to: TicketStatusKey }
  /** The action is allowed and the status stays as it is. */
  | { kind: 'unchanged'; status: TicketStatusKey }
  /** Every other combination: 409 TICKET_INVALID_TRANSITION. */
  | { kind: 'invalid'; status: TicketStatusKey; action: TicketTransitionAction };

export function isTicketStatusKey(value: unknown): value is TicketStatusKey {
  return typeof value === 'string' && (TICKET_STATUS_KEYS as readonly string[]).includes(value);
}

export function resolveTransition(
  status: TicketStatusKey,
  action: TicketTransitionAction,
): TransitionResult {
  const transition = VALID_TRANSITIONS.find(
    (candidate) => candidate.from === status && candidate.action === action,
  );
  if (transition) {
    return { kind: 'transition', from: transition.from, to: transition.to };
  }
  const unchanged = UNCHANGED_COMBINATIONS.some(
    (candidate) => candidate.status === status && candidate.action === action,
  );
  return unchanged ? { kind: 'unchanged', status } : { kind: 'invalid', status, action };
}

/** The status after the action, or null when the combination is refused. */
export function nextStatusKey(
  status: TicketStatusKey,
  action: TicketTransitionAction,
): TicketStatusKey | null {
  const result = resolveTransition(status, action);
  if (result.kind === 'transition') {
    return result.to;
  }
  return result.kind === 'unchanged' ? result.status : null;
}
