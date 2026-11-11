/** Response shapes of API-U3, with the additive divergences recorded in functional-spec.md. */

/** Author of a message, resolved when read so a deactivated user keeps their name (BR3.3). */
export interface MessageAuthorView {
  id: string;
  name: string;
}

/** API-U3 `Message`. There is no edit and no delete operation, so nothing here ever changes. */
export interface MessageView {
  id: string;
  body: string;
  author: MessageAuthorView;
  sentAt: string;
}

/**
 * Reading order of `listMessages`, added to the operation of API-U3 (BR3.2). `sort` is omitted
 * because `sentAt` is the only sortable field of the conversation; `desc` lets the tab ask for
 * the most recent page in a single call and display it chronologically (BR5.4).
 */
export const MESSAGE_ORDERS = ['asc', 'desc'] as const;
export type MessageOrder = (typeof MESSAGE_ORDERS)[number];
export const DEFAULT_MESSAGE_ORDER: MessageOrder = 'asc';

/** Text limits of the message body, applied on both sides of the API (BR2.1, Q3). */
export const MESSAGE_BODY_MIN_LENGTH = 1;
export const MESSAGE_BODY_MAX_LENGTH = 2000;

export interface SendMessageInput {
  body: string;
}

/** Columns of a message read for presentation; no relation of another unit is joined (DB-01). */
export interface MessageRow {
  id: string;
  body: string;
  authorId: string;
  sentAt: Date;
}
