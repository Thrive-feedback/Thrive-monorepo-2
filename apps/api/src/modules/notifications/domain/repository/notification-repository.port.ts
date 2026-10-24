import type { NotificationTypeValue } from '../value-object/notification-type.vo';

/**
 * One Notification as it is written: who is told, in which Workspace, about what, and by whom.
 * Ids and a type, and nothing anybody wrote — the words stay where they were written and are
 * read by following the Notification (design 0022 D3).
 */
export interface NotificationToRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly recipientAccountId: string;
  readonly type: NotificationTypeValue;
  readonly actorAccountId: string;
  /** The Ask, Feedback Request or Feedback this is about; which of them follows from `type`. */
  readonly subjectId: string;
}

/** Which Notification a Member is acting on. The recipient is the caller, never a parameter. */
export interface NotificationOfRecipient {
  readonly notificationId: string;
  readonly workspaceId: string;
  readonly recipientAccountId: string;
}

export abstract class NotificationRepository {
  /**
   * Writes one event's whole fan-out at once, so a request asking five people costs one round
   * trip rather than five — the recipients are already in hand when it is called.
   *
   * A row that would repeat one already written is dropped by the unique index rather than
   * refused, because being told twice about one thing is the failure and a retried or
   * double-submitted write is the ordinary way it happens (design 0022 D7, D8). Nothing is
   * answered about how many landed: the caller's contract is that the Member ends up with one
   * line per thing, which holds either way.
   */
  abstract recordAll(
    notifications: readonly NotificationToRecord[],
  ): Promise<void>;

  /**
   * Marks one of the caller's own as read, and answers `false` when there is none to mark.
   *
   * The recipient is part of the match rather than checked afterwards, so somebody else's id is
   * indistinguishable from one that does not exist — which is what the caller turns into a
   * refusal, and is why no row belonging to another Member can be touched by guessing an id.
   *
   * One already read is marked again and answers `true`: the Member asked for a state it is
   * already in, and got it.
   */
  abstract markRead(
    notification: NotificationOfRecipient,
    readAt: Date,
  ): Promise<boolean>;

  /**
   * Marks every unread Notification the recipient has in **this** Workspace, and no other. A
   * Member of several reads one bell at a time, so clearing it may not clear the rest.
   *
   * Only the unread ones are touched, so pressing the button on an already-empty bell writes no
   * rows at all rather than restamping a year of them.
   */
  abstract markAllRead(
    recipient: {
      readonly workspaceId: string;
      readonly recipientAccountId: string;
    },
    readAt: Date,
  ): Promise<void>;
}
