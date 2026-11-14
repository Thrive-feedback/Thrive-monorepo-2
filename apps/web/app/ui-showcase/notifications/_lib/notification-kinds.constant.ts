import { standInPhoto } from '@/app/ui-showcase/_lib/stand-in-photo.util';
import type {
  BellNotification,
  NotificationType,
} from '@/lib/notifications/notification.type';

/** The screen a bell line lands on, named in the words that screen itself uses. */
export type NotificationLanding = {
  /** The page's title, as the sidebar names it. */
  readonly page: string;
  /** The choice of the page's filter it opens on, or null for a page with none to show. */
  readonly showing: string | null;
  /** What opens over the page, or null when the page itself is the answer. */
  readonly overIt: string | null;
};

/** What one kind of notification is for, in words a person new to Thrive can follow. */
export type NotificationKind = {
  readonly title: string;
  /** The action somebody takes that raises it. */
  readonly when: string;
  readonly whoIsTold: string;
  /** The page pressing the bell line lands on, said rather than shown as a path. */
  readonly opens: string;
  /** The same page, as parts the showcase can draw. */
  readonly landsOn: NotificationLanding;
  /**
   * What the Discord direct message says, for a Member who linked Discord. Written as a
   * description because the message itself is composed by the API, which the web app cannot
   * import.
   */
  readonly inChat: string;
};

/** Home on its first filter, with the one piece of Feedback the line names open over it. */
const HOME_WITH_FEEDBACK_OVER_IT: NotificationLanding = {
  page: 'Home',
  showing: 'All Feedback',
  overIt: 'That Feedback',
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
    landsOn: {
      page: 'Waiting for me',
      showing: null,
      overIt: 'The Ask, on the postcard it is answered on',
    },
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
    landsOn: { page: 'Received', showing: 'My requests', overIt: null },
    inChat:
      'Who answered and in which Workspace, with a link to My requests. Nothing of the answer itself.',
  },
  FEEDBACK_RECEIVED: {
    title: 'Feedback written to you',
    when: 'Somebody offers Feedback and names this person as a Receiver.',
    whoIsTold: 'Each Receiver, once each.',
    opens: 'Home, with that Feedback open over it.',
    landsOn: HOME_WITH_FEEDBACK_OVER_IT,
    inChat:
      'Who wrote it and in which Workspace, with a link to the Feedback. None of its words.',
  },
  FEEDBACK_SHARED: {
    title: 'Feedback shared with you',
    when: 'Somebody offers Feedback with its Visibility set to Selected people, and picks this person.',
    whoIsTold:
      'Each person picked who is not also a Receiver. A Receiver who was also picked is told once, as a Receiver.',
    opens: 'Home, with that Feedback open over it.',
    landsOn: HOME_WITH_FEEDBACK_OVER_IT,
    inChat:
      'Who shared it and in which Workspace, with a link to the Feedback. None of its words.',
  },
  KUDOS_RECEIVED: {
    title: 'Kudos given to you',
    when: 'Somebody gives Kudos that @mentions this person. A Kudos naming nobody is for the whole Workspace and tells nobody.',
    whoIsTold: 'Each person the Kudos mentions, once each.',
    opens:
      'Received, showing Kudos. A Kudos has no page of its own, so the line opens the list it is on.',
    landsOn: { page: 'Received', showing: 'Kudos', overIt: null },
    inChat:
      'Who gave it and in which Workspace, with a link to the Kudos given to you. None of its words; the Workspace channel is where those are posted.',
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
const ANN_PHOTO = standInPhoto('#a78bfa', '#6d28d9');
const MAI_PHOTO = standInPhoto('#fdba74', '#ea580c');

/**
 * Lines for the sample bell: one unread line of every kind, one already read, and one whose
 * actor has no name to show. Some actors have a photo and some show their initials. Each says who
 * can read what it leads to, but the last, which stands for a line written before that was
 * recorded and shows no icon.
 */
export const SAMPLE_NOTIFICATIONS: readonly BellNotification[] = [
  {
    id: 'sample-ask-received',
    type: 'ASK_RECEIVED',
    actorName: 'Ann Lee',
    actorPhotoUrl: ANN_PHOTO,
    subjectId: 'sample-ask',
    createdAt: AN_HOUR_AGO,
    isRead: false,
    audience: 'EVERYONE',
  },
  {
    id: 'sample-ask-answered',
    type: 'ASK_ANSWERED',
    actorName: 'Nut Somchai',
    actorPhotoUrl: null,
    subjectId: 'sample-request',
    createdAt: AN_HOUR_AGO,
    isRead: false,
    audience: 'ONLY_ME',
  },
  {
    id: 'sample-feedback-received',
    type: 'FEEDBACK_RECEIVED',
    actorName: 'Mai Tanaka',
    actorPhotoUrl: MAI_PHOTO,
    subjectId: 'sample-feedback',
    createdAt: AN_HOUR_AGO,
    isRead: false,
    audience: 'ONLY_ME',
  },
  {
    id: 'sample-feedback-shared',
    type: 'FEEDBACK_SHARED',
    actorName: 'Ben Carter',
    actorPhotoUrl: null,
    subjectId: 'sample-feedback',
    createdAt: AN_HOUR_AGO,
    isRead: false,
    audience: 'EVERYONE',
  },
  {
    id: 'sample-kudos-received',
    type: 'KUDOS_RECEIVED',
    actorName: 'Mai Tanaka',
    actorPhotoUrl: MAI_PHOTO,
    subjectId: 'sample-kudos',
    createdAt: AN_HOUR_AGO,
    isRead: false,
    audience: 'EVERYONE',
  },
  {
    id: 'sample-read',
    type: 'FEEDBACK_RECEIVED',
    actorName: 'Ann Lee',
    actorPhotoUrl: ANN_PHOTO,
    subjectId: 'sample-feedback',
    createdAt: YESTERDAY,
    isRead: true,
    audience: 'SELECTED_PEOPLE',
  },
  {
    id: 'sample-unnamed',
    type: 'ASK_RECEIVED',
    actorName: null,
    actorPhotoUrl: null,
    subjectId: 'sample-ask',
    createdAt: YESTERDAY,
    isRead: true,
    audience: null,
  },
];
