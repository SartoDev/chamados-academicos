/**
 * Who is told that a message arrived (BR4.3). Pure module: it receives the facts of the message
 * and answers the distinct recipients, never the author. The record itself is written by the
 * public notification service of U2, inside the transaction of the send (BR4.1, BR8.4 of U2).
 */
export const MESSAGE_NOTIFICATION_KIND = 'MESSAGE_RECEIVED';

export interface MessageNotificationContext {
  authorId: string;
  requesterId: string;
  /** The current assignee of the ticket, or nothing while it waits in the sector queue. */
  assigneeId: string | null;
}

/**
 * A message from the requester tells the current assignee; with no assignee it tells nobody,
 * because the ticket is already in the sector queue. A message from the attendance tells the
 * requester and, when there is an assignee who did not write it, the assignee too. The author
 * never receives a notice of their own message (BR6.2 of U2).
 */
export function planMessageRecipients(context: MessageNotificationContext): string[] {
  const fromRequester = context.authorId === context.requesterId;
  const candidates = fromRequester
    ? [context.assigneeId]
    : [context.requesterId, context.assigneeId];
  const recipients = new Set<string>();
  for (const candidate of candidates) {
    if (candidate !== null && candidate !== context.authorId) {
      recipients.add(candidate);
    }
  }
  return [...recipients];
}
