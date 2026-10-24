import type { components } from '@repo/api';

type NotificationItem =
  components['schemas']['ListNotificationsResponseDto_Output']['items'][number];

/**
 * What happened, as the API names it. Derived from the contract rather than written out, so a
 * kind added or renamed there arrives here as a compiler error rather than as a blank line.
 */
export type NotificationType = NotificationItem['type'];

/** One line in the bell. It names who did something and what it concerns, never the words. */
export type BellNotification = {
  readonly id: string;
  readonly type: NotificationType;
  /**
   * The name of whoever did it, or `null` for somebody who has not introduced themselves or
   * whose Account is gone. The sentence has to read either way.
   */
  readonly actorName: string | null;
  /** The Ask, the Feedback Request or the Feedback the line leads to. */
  readonly subjectId: string;
  readonly createdAt: string;
  readonly isRead: boolean;
};
