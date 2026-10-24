import { ROUTES } from '@/lib/routes.constant';
import type { BellNotification, NotificationType } from './notification.type';

/**
 * What a line calls somebody it cannot name: a person who has not introduced themselves, or
 * whose Account is gone. The sentence has to stay a sentence, so it gets a word rather than a
 * gap.
 */
const SOMEBODY = 'Somebody';

type NotificationLineTemplate = {
  /** The whole sentence, with whoever did it already in it. */
  readonly sentenceFor: (actor: string) => string;
  /** Where pressing the line lands, as a path in this app. */
  readonly destinationFor: (subjectId: string) => string;
};

/**
 * What a bell line says and where it leads, by what happened.
 *
 * The API sends neither: it sends ids, a kind and a time, and the destination is a web route
 * the API has no business knowing. So the sentence lives here, beside `ROUTES`, and carries
 * none of what was written — a Notification is a pointer, not a copy.
 *
 * Exhaustive by construction: a fifth kind in the contract cannot be ignored here, because
 * this record would then be missing a key and would not compile.
 */
export const NOTIFICATION_LINES: Readonly<
  Record<NotificationType, NotificationLineTemplate>
> = {
  ASK_RECEIVED: {
    sentenceFor: (actor) => `${actor} asked you for feedback`,
    destinationFor: (subjectId) => ROUTES.homeAsk(subjectId),
  },
  ASK_ANSWERED: {
    sentenceFor: (actor) => `${actor} answered your request`,
    destinationFor: (subjectId) => ROUTES.homeRequest(subjectId),
  },
  FEEDBACK_RECEIVED: {
    sentenceFor: (actor) => `${actor} wrote feedback to you`,
    destinationFor: (subjectId) => ROUTES.homeFeedback(subjectId),
  },
  FEEDBACK_SHARED: {
    sentenceFor: (actor) => `${actor} shared feedback with you`,
    destinationFor: (subjectId) => ROUTES.homeFeedback(subjectId),
  },
};

/** One line, ready to draw: what it says and where it goes. */
export type NotificationLine = {
  readonly sentence: string;
  readonly destination: string;
};

/** What to say about one thing somebody was told, and where pressing it takes them. */
export function notificationLine(
  notification: Pick<BellNotification, 'type' | 'actorName' | 'subjectId'>,
): NotificationLine {
  const template = NOTIFICATION_LINES[notification.type];
  const actor = notification.actorName?.trim();
  return {
    sentence: template.sentenceFor(
      actor === undefined || actor === '' ? SOMEBODY : actor,
    ),
    destination: template.destinationFor(notification.subjectId),
  };
}
