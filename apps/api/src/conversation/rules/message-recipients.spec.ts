import { describe, expect, it } from '@jest/globals';
import {
  MESSAGE_NOTIFICATION_KIND,
  planMessageRecipients,
  type MessageNotificationContext,
} from './message-recipients.js';

const REQUESTER = 'user-student';
const ASSIGNEE = 'user-agent';
const MANAGER = 'user-manager';

function context(overrides: Partial<MessageNotificationContext> = {}): MessageNotificationContext {
  return { authorId: REQUESTER, requesterId: REQUESTER, assigneeId: ASSIGNEE, ...overrides };
}

describe('message recipients (BR4.3, Q4)', () => {
  it('records the notice under the kind the shared enum already had', () => {
    expect(MESSAGE_NOTIFICATION_KIND).toBe('MESSAGE_RECEIVED');
  });

  it('tells the current assignee when the requester writes', () => {
    expect(planMessageRecipients(context())).toEqual([ASSIGNEE]);
  });

  it('tells nobody when the requester writes on a ticket without an assignee', () => {
    expect(planMessageRecipients(context({ assigneeId: null }))).toEqual([]);
  });

  it('tells the requester when the assignee answers, and never the author', () => {
    const recipients = planMessageRecipients(context({ authorId: ASSIGNEE }));

    expect(recipients).toEqual([REQUESTER]);
    expect(recipients).not.toContain(ASSIGNEE);
  });

  it('tells the requester and the assignee when a manager who is not the assignee answers', () => {
    const recipients = planMessageRecipients(context({ authorId: MANAGER }));

    expect(recipients).toEqual([REQUESTER, ASSIGNEE]);
    expect(recipients).not.toContain(MANAGER);
  });

  it('tells only the requester when a manager answers a ticket without an assignee', () => {
    expect(planMessageRecipients(context({ authorId: MANAGER, assigneeId: null }))).toEqual([
      REQUESTER,
    ]);
  });

  it('never repeats a recipient who is both the requester and the assignee', () => {
    const recipients = planMessageRecipients(
      context({ authorId: MANAGER, requesterId: REQUESTER, assigneeId: REQUESTER }),
    );

    expect(recipients).toEqual([REQUESTER]);
  });

  it('tells nobody when the author is at once the requester and the assignee', () => {
    expect(planMessageRecipients(context({ authorId: REQUESTER, assigneeId: REQUESTER }))).toEqual(
      [],
    );
  });
});
