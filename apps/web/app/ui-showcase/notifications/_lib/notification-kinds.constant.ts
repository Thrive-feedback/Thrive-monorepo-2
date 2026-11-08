import type {
  BellNotification,
  NotificationType,
} from '@/lib/notifications/notification.type';

/** What one kind of notification is for, in words a person new to Thrive can follow. */
export type NotificationKind = {
  readonly title: string;
  /** The action somebody takes that raises it. */
  readonly when: string;
  readonly whoIsTold: string;
  /** The page pressing the bell line lands on, said rather than shown as a path. */
  readonly opens: string;
  /**
   * What the Discord direct message says, for a Member who linked Discord. Written as a
   * description because the message itself is composed by the API, which the web app cannot
   * import.
   */
  readonly inChat: string;
};

/**
 * Every kind the bell can show. Keyed by the contract's type, so a kind added there fails to
 * compile here until somebody says what it is for.
 */
export const NOTIFICATION_KINDS: Readonly<
  Record<NotificationType, NotificationKind>
> = {
  ASK_RECEIVED: {
    title: 'Asked for feedback',
    when: 'Somebody sends a Feedback Request and names this person as one of its Givers.',
    whoIsTold:
      'Each Giver on the request, once each. Every Giver gets their own Ask.',
    opens:
      'Waiting for me, with that Ask open on the postcard it is answered on.',
    inChat:
      'Who asked, in which Workspace, the request itself quoted on one line (cut at 120 characters), and a link to the Ask.',
  },
  ASK_ANSWERED: {
    title: 'Request answered',
    when: 'A Giver answers an Ask from a Feedback Request this person sent.',
    whoIsTold:
      'The Requester, and nobody else. The other Givers on the same request are not told.',
    opens:
      'Received, showing My requests. A request has no page of its own, so the line opens the list it is on.',
    inChat:
      'Who answered and in which Workspace, with a link to My requests. Nothing of the answer itself.',
  },
  FEEDBACK_RECEIVED: {
    title: 'Feedback written to you',
    when: 'Somebody offers Feedback and names this person as a Receiver.',
    whoIsTold: 'Each Receiver, once each.',
    opens: 'Home, with that Feedback open over it.',
    inChat:
      'Who wrote it and in which Workspace, with a link to the Feedback. None of its words.',
  },
  FEEDBACK_SHARED: {
    title: 'Feedback shared with you',
    when: 'Somebody offers Feedback with its Visibility set to Selected people, and picks this person.',
    whoIsTold:
      'Each person picked who is not also a Receiver. A Receiver who was also picked is told once, as a Receiver.',
    opens: 'Home, with that Feedback open over it.',
    inChat:
      'Who shared it and in which Workspace, with a link to the Feedback. None of its words.',
  },
};

/** One kind of post Thrive makes into the channel a Workspace connected. */
export type ChannelPost = {
  readonly title: string;
  readonly when: string;
  readonly carries: string;
  readonly linksTo: string;
};

/**
 * What the Workspace's own channel is told. These reach everybody in the channel, so they never
 * reach the bell: nobody in particular is being told.
 */
export const CHANNEL_POSTS: readonly ChannelPost[] = [
  {
    title: 'Feedback the whole Workspace can see',
    when: 'Feedback is offered, or an Ask is answered, with its Visibility set to everyone.',
    carries: 'Who gave it and who it was for. None of what it says.',
    linksTo: 'Home, with that Feedback open over it.',
  },
  {
    title: 'Kudos',
    when: 'Somebody gives Kudos.',
    carries:
      'Who gave it, who it was for, and its message, because every Member can already read a Kudos.',
    linksTo: 'The Kudos board. A Kudos has no page of its own.',
  },
];

const AN_HOUR_AGO = '2026-11-08T09:00:00.000Z';
const YESTERDAY = '2026-11-07T10:00:00.000Z';

/**
 * Lines for the sample bell: one unread line of every kind, one already read, and one whose
 * actor has no name to show.
 */
export const SAMPLE_NOTIFICATIONS: readonly BellNotification[] = [
  {
    id: 'sample-ask-received',
    type: 'ASK_RECEIVED',
    actorName: 'Ann Lee',
    subjectId: 'sample-ask',
    createdAt: AN_HOUR_AGO,
    isRead: false,
  },
  {
    id: 'sample-ask-answered',
    type: 'ASK_ANSWERED',
    actorName: 'Nut Somchai',
    subjectId: 'sample-request',
    createdAt: AN_HOUR_AGO,
    isRead: false,
  },
  {
    id: 'sample-feedback-received',
    type: 'FEEDBACK_RECEIVED',
    actorName: 'Mai Tanaka',
    subjectId: 'sample-feedback',
    createdAt: AN_HOUR_AGO,
    isRead: false,
  },
  {
    id: 'sample-feedback-shared',
    type: 'FEEDBACK_SHARED',
    actorName: 'Ben Carter',
    subjectId: 'sample-feedback',
    createdAt: AN_HOUR_AGO,
    isRead: false,
  },
  {
    id: 'sample-read',
    type: 'FEEDBACK_RECEIVED',
    actorName: 'Ann Lee',
    subjectId: 'sample-feedback',
    createdAt: YESTERDAY,
    isRead: true,
  },
  {
    id: 'sample-unnamed',
    type: 'ASK_RECEIVED',
    actorName: null,
    subjectId: 'sample-ask',
    createdAt: YESTERDAY,
    isRead: true,
  },
];
