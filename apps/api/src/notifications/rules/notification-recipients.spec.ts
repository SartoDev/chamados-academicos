import { describe, expect, it } from '@jest/globals';
import {
  groupTargetsByKind,
  isNotificationKind,
  kindForChanges,
  planTicketNotifications,
  type NotificationContext,
} from './notification-recipients.js';

const REQUESTER = 'user-student';
const AGENT = 'user-agent';
const MANAGER = 'user-manager';

function context(overrides: Partial<NotificationContext> = {}): NotificationContext {
  return {
    operation: 'ASSUME',
    actorId: AGENT,
    requesterId: REQUESTER,
    previousAssigneeId: null,
    changes: { sectorChanged: false, assigneeChanged: false, statusChanged: false },
    ...overrides,
  };
}

describe('notification recipients (BR6.1, BR6.2)', () => {
  it('tells the requester who took the ticket, choosing the assignee change over the status', () => {
    const targets = planTicketNotifications(
      context({ changes: { sectorChanged: false, assigneeChanged: true, statusChanged: true } }),
    );

    expect(targets).toEqual([{ recipientId: REQUESTER, kind: 'ASSIGNEE_CHANGED' }]);
  });

  it('chooses the sector change above every other change of the same operation', () => {
    const targets = planTicketNotifications(
      context({
        operation: 'TRANSFER',
        previousAssigneeId: AGENT,
        changes: { sectorChanged: true, assigneeChanged: true, statusChanged: true },
      }),
    );

    expect(targets).toEqual([{ recipientId: REQUESTER, kind: 'SECTOR_CHANGED' }]);
    expect(
      kindForChanges({ sectorChanged: false, assigneeChanged: false, statusChanged: true }),
    ).toBe('STATUS_CHANGED');
  });

  it('tells the requester when the attendance moves the ticket along', () => {
    const targets = planTicketNotifications(
      context({
        operation: 'WAIT_FOR_REQUESTER',
        changes: { sectorChanged: false, assigneeChanged: false, statusChanged: true },
      }),
    );

    expect(targets).toEqual([{ recipientId: REQUESTER, kind: 'STATUS_CHANGED' }]);
  });

  it('tells the assignee when the requester closes the ticket, and never the requester', () => {
    const targets = planTicketNotifications(
      context({
        operation: 'CLOSE',
        actorId: REQUESTER,
        previousAssigneeId: AGENT,
        changes: { sectorChanged: false, assigneeChanged: false, statusChanged: true },
      }),
    );

    expect(targets).toEqual([{ recipientId: AGENT, kind: 'STATUS_CHANGED' }]);
  });

  it('tells only the requester when the attendance closes the ticket', () => {
    const targets = planTicketNotifications(
      context({
        operation: 'CLOSE',
        actorId: MANAGER,
        previousAssigneeId: AGENT,
        changes: { sectorChanged: false, assigneeChanged: false, statusChanged: true },
      }),
    );

    expect(targets).toEqual([{ recipientId: REQUESTER, kind: 'STATUS_CHANGED' }]);
  });

  it('tells the last assignee about a reopening, and never the requester who reopened', () => {
    const targets = planTicketNotifications(
      context({
        operation: 'REOPEN',
        actorId: REQUESTER,
        previousAssigneeId: AGENT,
        changes: { sectorChanged: false, assigneeChanged: false, statusChanged: true },
      }),
    );

    expect(targets).toEqual([{ recipientId: AGENT, kind: 'TICKET_REOPENED' }]);
  });

  it('notifies nobody for a priority change or for the requester message (BR4.4)', () => {
    expect(planTicketNotifications(context({ operation: 'CHANGE_PRIORITY' }))).toEqual([]);
    expect(
      planTicketNotifications(
        context({
          operation: 'REQUESTER_MESSAGE',
          actorId: REQUESTER,
          changes: { sectorChanged: false, assigneeChanged: false, statusChanged: true },
        }),
      ),
    ).toEqual([]);
    expect(
      kindForChanges({ sectorChanged: false, assigneeChanged: false, statusChanged: false }),
    ).toBeNull();
  });

  it('never notifies the actor, even when they are the requester of the ticket', () => {
    const targets = planTicketNotifications(
      context({
        operation: 'CLOSE',
        actorId: REQUESTER,
        previousAssigneeId: null,
        changes: { sectorChanged: false, assigneeChanged: false, statusChanged: true },
      }),
    );

    expect(targets).toEqual([]);
  });

  it('keeps one notice per recipient and groups the notices by kind (BR8.4)', () => {
    const grouped = groupTargetsByKind([
      { recipientId: REQUESTER, kind: 'STATUS_CHANGED' },
      { recipientId: AGENT, kind: 'STATUS_CHANGED' },
      { recipientId: MANAGER, kind: 'TICKET_REOPENED' },
    ]);

    expect(grouped).toEqual([
      { kind: 'STATUS_CHANGED', recipientIds: [REQUESTER, AGENT] },
      { kind: 'TICKET_REOPENED', recipientIds: [MANAGER] },
    ]);
    expect(groupTargetsByKind([])).toEqual([]);
  });

  it('recognizes the five kinds of notification', () => {
    expect(isNotificationKind('MESSAGE_RECEIVED')).toBe(true);
    expect(isNotificationKind('TICKET_REOPENED')).toBe(true);
    expect(isNotificationKind('SOMETHING_ELSE')).toBe(false);
    expect(isNotificationKind(undefined)).toBe(false);
  });
});
