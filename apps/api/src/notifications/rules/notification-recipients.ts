/**
 * Who is notified by an operation and with which kind (BR6.1, BR6.2). Pure module: it receives
 * the facts of the operation and answers one notice per recipient, never for the actor.
 */
export const NOTIFICATION_KINDS = [
  'MESSAGE_RECEIVED',
  'STATUS_CHANGED',
  'ASSIGNEE_CHANGED',
  'SECTOR_CHANGED',
  'TICKET_REOPENED',
] as const;

export type NotificationKindValue = (typeof NOTIFICATION_KINDS)[number];

export type NotifiableOperation =
  | 'ASSUME'
  | 'ASSIGN'
  | 'TRANSFER'
  | 'WAIT_FOR_REQUESTER'
  | 'CLOSE'
  | 'REOPEN'
  | 'CHANGE_PRIORITY'
  | 'REQUESTER_MESSAGE';

export interface TicketChanges {
  sectorChanged: boolean;
  assigneeChanged: boolean;
  statusChanged: boolean;
}

export interface NotificationContext {
  operation: NotifiableOperation;
  actorId: string;
  requesterId: string;
  /** The assignee before the operation: notified when the requester closes and on reopening. */
  previousAssigneeId: string | null;
  changes: TicketChanges;
}

export interface NotificationTarget {
  recipientId: string;
  kind: NotificationKindValue;
}

export function isNotificationKind(value: unknown): value is NotificationKindValue {
  return typeof value === 'string' && (NOTIFICATION_KINDS as readonly string[]).includes(value);
}

/** BR6.1: when an operation changes more than one aspect, the most meaningful one names it. */
export function kindForChanges(changes: TicketChanges): NotificationKindValue | null {
  if (changes.sectorChanged) {
    return 'SECTOR_CHANGED';
  }
  if (changes.assigneeChanged) {
    return 'ASSIGNEE_CHANGED';
  }
  return changes.statusChanged ? 'STATUS_CHANGED' : null;
}

/**
 * At most one notification per recipient (BR6.1), never for whoever caused the event (BR6.2).
 * A priority change notifies nobody, and the requester's message notifies nobody here: U3
 * records the message notification for the assignee in the same operation (BR4.4).
 */
export function planTicketNotifications(context: NotificationContext): NotificationTarget[] {
  if (context.operation === 'REQUESTER_MESSAGE') {
    return [];
  }
  const targets: NotificationTarget[] = [];
  const requesterKind = kindForChanges(context.changes);
  if (requesterKind) {
    targets.push({ recipientId: context.requesterId, kind: requesterKind });
  }
  const closedByRequester =
    context.operation === 'CLOSE' && context.actorId === context.requesterId;
  if (closedByRequester && context.previousAssigneeId) {
    targets.push({ recipientId: context.previousAssigneeId, kind: 'STATUS_CHANGED' });
  }
  if (context.operation === 'REOPEN' && context.previousAssigneeId) {
    targets.push({ recipientId: context.previousAssigneeId, kind: 'TICKET_REOPENED' });
  }

  const chosen = new Map<string, NotificationKindValue>();
  for (const target of targets) {
    if (target.recipientId !== context.actorId && !chosen.has(target.recipientId)) {
      chosen.set(target.recipientId, target.kind);
    }
  }
  return [...chosen].map(([recipientId, kind]) => ({ recipientId, kind }));
}

/** The targets as one group per kind, the shape the notification record takes (BR8.4). */
export function groupTargetsByKind(
  targets: readonly NotificationTarget[],
): Array<{ kind: NotificationKindValue; recipientIds: string[] }> {
  const groups = new Map<NotificationKindValue, string[]>();
  for (const target of targets) {
    const recipients = groups.get(target.kind);
    if (recipients) {
      recipients.push(target.recipientId);
    } else {
      groups.set(target.kind, [target.recipientId]);
    }
  }
  return [...groups].map(([kind, recipientIds]) => ({ kind, recipientIds }));
}
