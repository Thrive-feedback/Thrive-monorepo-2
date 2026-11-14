import { PERSONAL_VIEWS, ROUTES } from '@/lib/routes.constant';
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
 * Exhaustive by construction: a new kind in the contract cannot be ignored here, because
 * this record would then be missing a key and would not compile.
 */
export const NOTIFICATION_LINES: Readonly<
  Record<NotificationType, NotificationLineTemplate>
> = {
  ASK_RECEIVED: {
    sentenceFor: (actor) => `${actor} asked you for feedback`,
    destinationFor: (subjectId) => ROUTES.waitingAsk(subjectId),
  },
  ASK_ANSWERED: {
    sentenceFor: (actor) => `${actor} answered your request`,
    // Received has no address for one request, so the bell opens the person's requests.
    destinationFor: () => ROUTES.receivedViewing(PERSONAL_VIEWS[0], 'requests'),
  },
  FEEDBACK_RECEIVED: {
    sentenceFor: (actor) => `${actor} wrote feedback to you`,
    destinationFor: (subjectId) => ROUTES.homeFeedback(subjectId, 'all'),
  },
  FEEDBACK_SHARED: {
    sentenceFor: (actor) => `${actor} shared feedback with you`,
    destinationFor: (subjectId) => ROUTES.homeFeedback(subjectId, 'all'),
  },
  KUDOS_RECEIVED: {
    sentenceFor: (actor) => `${actor} gave you kudos`,
    // A Kudos has no address of its own, so the bell opens the Kudos given to the person.
    destinationFor: () => ROUTES.receivedViewing(PERSONAL_VIEWS[0], 'kudos'),
  },
};

/**
 * Whether this build has a sentence for a kind. The contract fixes the kinds at build time, and
 * every table here is keyed by them, so a kind added later fails to compile until it is given
 * one. A running bundle can still be handed a kind it was built without — by an API deployed
 * ahead of the web, or by a newer web server answering a tab opened before the deploy — so the
 * bell checks with this where it draws, and leaves such a line out rather than drawing it without
 * a sentence, which would take the page down with it.
 */
export function isDrawableKind(type: string): type is NotificationType {
  return Object.hasOwn(NOTIFICATION_LINES, type);
}

/** One line, ready to draw: who it names, what it says and where it goes. */
export type NotificationLine = {
  /** The name the sentence uses, so a face drawn beside it shows the same person's initials. */
  readonly actor: string;
  readonly sentence: string;
  readonly destination: string;
};

/** What to say about one thing somebody was told, and where pressing it takes them. */
export function notificationLine(
  notification: Pick<BellNotification, 'type' | 'actorName' | 'subjectId'>,
): NotificationLine {
  const template = NOTIFICATION_LINES[notification.type];
  const named = notification.actorName?.trim();
  const actor = named === undefined || named === '' ? SOMEBODY : named;
  return {
    actor,
    sentence: template.sentenceFor(actor),
    destination: template.destinationFor(notification.subjectId),
  };
}
