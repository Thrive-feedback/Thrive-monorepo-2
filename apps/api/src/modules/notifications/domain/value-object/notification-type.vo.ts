import { NotificationTypeNotSupportedError } from '../notifications.errors';

/**
 * The things a Member is told about (glossary: Notification). Four values for the three events
 * Thrive raises, because Feedback written to somebody and Feedback shared with them are the same
 * event seen from two sides and read as two different sentences.
 *
 * The type is also the whole of what a Notification says: the kind of thing `subjectId` names
 * follows from it — an Ask for `ASK_RECEIVED`, a Feedback Request for `ASK_ANSWERED`, a piece of
 * Feedback for the other two — so a stored row needs no second column to say which it was
 * (design 0022 D4).
 */
export const NOTIFICATION_TYPES = [
  'ASK_RECEIVED',
  'ASK_ANSWERED',
  'FEEDBACK_RECEIVED',
  'FEEDBACK_SHARED',
] as const;

export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

function isNotificationType(raw: string): raw is NotificationTypeValue {
  return (NOTIFICATION_TYPES as readonly string[]).includes(raw);
}

export class NotificationType {
  private constructor(private readonly value: NotificationTypeValue) {}

  /** Every type value entering from outside passes here, a stored row's included. */
  static of(raw: string): NotificationType {
    if (!isNotificationType(raw)) {
      throw new NotificationTypeNotSupportedError();
    }
    return new NotificationType(raw);
  }

  toString(): NotificationTypeValue {
    return this.value;
  }
}
