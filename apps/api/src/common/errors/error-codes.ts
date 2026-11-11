/**
 * Error code catalogue of the system (X-01). U1 owns the generic codes and its own prefixes;
 * each later unit adds its prefixes here, with the status fixed in X-01 — U2 owns TICKET_* and
 * NOTIFICATION_*, U3 owns MESSAGE_*, U5 owns RATING_*. The code is the stable contract; the
 * frontend translates it. Codes only grow
 * by addition, and an existing code never changes meaning.
 */
export const ERROR_HTTP_STATUS = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  AUTH_INVALID_CREDENTIALS: 401,
  AUTH_TOO_MANY_ATTEMPTS: 429,
  USER_NOT_FOUND: 404,
  USER_EMAIL_TAKEN: 409,
  USER_SECTOR_REQUIRED: 422,
  USER_SELF_MODIFICATION_FORBIDDEN: 422,
  USER_LAST_ACTIVE_ADMIN: 422,
  CATALOG_ITEM_NOT_FOUND: 404,
  CATALOG_ITEM_INACTIVE: 422,
  CATALOG_NAME_TAKEN: 409,
  CATALOG_DEFAULT_PRIORITY_REQUIRED: 422,
  // U2 (tickets and notifications).
  TICKET_NOT_FOUND: 404,
  TICKET_INVALID_TRANSITION: 409,
  TICKET_ALREADY_ASSIGNED: 409,
  TICKET_REOPEN_WINDOW_EXPIRED: 409,
  TICKET_CLOSED: 403,
  TICKET_ASSIGNEE_NOT_IN_SECTOR: 422,
  TICKET_TRANSFER_SAME_SECTOR: 422,
  TICKET_QUEUE_NO_SECTOR: 403,
  NOTIFICATION_NOT_FOUND: 404,
  // U3 (conversation).
  MESSAGE_TICKET_CLOSED: 409,
  // U5 (rating). RATING_ALREADY_EXISTS distinguishes "already rated" from "not closed" (BR2.3).
  RATING_NOT_FOUND: 404,
  RATING_TICKET_NOT_CLOSED: 409,
  RATING_ALREADY_EXISTS: 409,
} as const satisfies Record<string, number>;

export type ErrorCode = keyof typeof ERROR_HTTP_STATUS;

export const ERROR_CODES = Object.keys(ERROR_HTTP_STATUS) as ErrorCode[];
