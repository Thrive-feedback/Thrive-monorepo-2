import type { FeedItem } from '@/lib/feedback/feed-item.type';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import type { SentRequest } from '@/lib/feedback/sent-request.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';

/*
 * MADE-UP DATA for the landing page's preview of Home. Nobody here is real and nothing in the
 * preview reaches the API. The visitor is Ploy, a founder, in her own Workspace, and her Home tells
 * the stories of the page's Moments (`ADR-0038`) in their own words: her pitch and her shorter
 * meetings asked about and answered, Fern's rehearsal waiting on her, and the onboarding thank-you,
 * given unasked and shared with everyone since Kudos is not built yet.
 */

export const PREVIEW_WORKSPACE_NAME = 'Sunrise Studio';

/** The Workspace Goals Ploy set, which `#` offers in the preview's forms. */
export const PREVIEW_WORKSPACE_GOALS: readonly string[] = [
  'ownership',
  'customer-first',
];

export const PREVIEW_TEAMMATES: readonly Teammate[] = [
  {
    accountId: 'preview-nok',
    name: 'Nok Chaiyo',
    email: 'nok@thrive.example',
    photoUrl: null,
    slug: 'nok',
    displayName: 'Nok',
  },
  {
    accountId: 'preview-arm',
    name: 'Arm Wattana',
    email: 'arm@thrive.example',
    photoUrl: null,
    slug: 'arm',
    displayName: 'Arm',
  },
  {
    accountId: 'preview-fern',
    name: 'Fern Somsak',
    email: 'fern@thrive.example',
    photoUrl: null,
    slug: 'fern',
    displayName: 'Fern',
  },
  {
    accountId: 'preview-dao',
    name: 'Dao Rattana',
    email: 'dao@thrive.example',
    photoUrl: null,
    slug: 'dao',
    displayName: 'Dao',
  },
];

/** Somebody a preview card names, with no photo: the preview draws initials. */
function named(name: string) {
  return { name, photoUrl: null, inactive: false, isYou: false } as const;
}

/** Ploy, the visitor: named "you" wherever her own Home names her. */
export const PREVIEW_YOU = {
  name: 'Ploy Srisuk',
  photoUrl: null,
  inactive: false,
  isYou: true,
} as const;

const PITCH_QUESTION =
  'In today’s pitch, what’s one thing I should change before the next one?';
const MEETINGS_QUESTION =
  'I’m working on shorter meetings. Where did we lose time this morning?';
const PITCH_ANSWER =
  'When you opened with market size, the room went quiet. When you told Mai’s story, they leaned in. Next time, open with the story.';
const MEETINGS_ANSWER =
  'We spent 20 minutes on a ticket nobody had read. Next time, share the board the day before.';

export const PREVIEW_WORKSPACE_FEED: readonly FeedItem[] = [
  {
    id: 'preview-feed-1',
    giverName: 'Dao Rattana',
    giverPhotoUrl: null,
    giverInactive: false,
    giverIsYou: false,
    receivers: [named('Nok Chaiyo'), PREVIEW_YOU, named('Fern Somsak')],
    origin: 'OFFERED',
    message:
      'Your onboarding notes answered every question our new designer had. She shipped her first screen on day three. Thank you!',
    messageTags: NO_TEXT_TAGS,
    givenAt: '2026-10-20T09:30:00.000Z',
    reactions: { '👏': ['Ploy Srisuk', 'Fern Somsak'], '❤️': ['Arm Wattana'] },
    request: null,
  },
  {
    id: 'preview-feed-2',
    giverName: 'Nok Chaiyo',
    giverPhotoUrl: null,
    giverInactive: false,
    giverIsYou: false,
    receivers: [PREVIEW_YOU],
    origin: 'REQUESTED',
    message: MEETINGS_ANSWER,
    messageTags: NO_TEXT_TAGS,
    givenAt: '2026-10-19T04:15:00.000Z',
    reactions: { '💡': ['Arm Wattana'], '🙏': ['Ploy Srisuk'] },
    request: {
      message: MEETINGS_QUESTION,
      messageTags: NO_TEXT_TAGS,
      requester: PREVIEW_YOU,
      asked: [named('Nok Chaiyo'), named('Fern Somsak')],
    },
  },
];

export const PREVIEW_SHARED_WITH_ME: readonly FeedItem[] = [
  {
    id: 'preview-shared-1',
    giverName: 'Arm Wattana',
    giverPhotoUrl: null,
    giverInactive: false,
    giverIsYou: false,
    receivers: [named('Fern Somsak')],
    origin: 'REQUESTED',
    message:
      'The demo started before you explained the problem, so I didn’t know what I was looking at. Swap them.',
    messageTags: NO_TEXT_TAGS,
    givenAt: '2026-10-20T07:45:00.000Z',
    reactions: {},
    request: {
      message: 'Did my product demo make sense from where you sat?',
      messageTags: NO_TEXT_TAGS,
      requester: named('Fern Somsak'),
      asked: [named('Arm Wattana')],
    },
  },
];

export const PREVIEW_SENT_REQUESTS: readonly SentRequest[] = [
  {
    id: 'preview-request-1',
    message: PITCH_QUESTION,
    messageTags: NO_TEXT_TAGS,
    sentAt: '2026-10-20T03:10:00.000Z',
    asks: [
      {
        askId: 'preview-sent-ask-1',
        giverName: 'Arm Wattana',
        giverPhotoUrl: null,
        giverInactive: false,
        status: 'ANSWERED',
        answer: {
          message: PITCH_ANSWER,
          messageTags: NO_TEXT_TAGS,
          answeredAt: '2026-10-20T03:40:00.000Z',
        },
      },
    ],
    readers: { value: 'ONLY_ME', selectedPeople: [] },
  },
  {
    id: 'preview-request-2',
    message: MEETINGS_QUESTION,
    messageTags: NO_TEXT_TAGS,
    sentAt: '2026-10-19T02:00:00.000Z',
    asks: [
      {
        askId: 'preview-sent-ask-2',
        giverName: 'Nok Chaiyo',
        giverPhotoUrl: null,
        giverInactive: false,
        status: 'ANSWERED',
        answer: {
          message: MEETINGS_ANSWER,
          messageTags: NO_TEXT_TAGS,
          answeredAt: '2026-10-19T04:15:00.000Z',
        },
      },
      {
        askId: 'preview-sent-ask-3',
        giverName: 'Fern Somsak',
        giverPhotoUrl: null,
        giverInactive: false,
        status: 'PENDING',
        answer: null,
      },
    ],
    readers: { value: 'EVERYONE', selectedPeople: [] },
  },
];

export const PREVIEW_WAITING_ASKS: readonly MyAsk[] = [
  {
    askId: 'preview-ask-1',
    message: 'In our run-through just now, where did you get lost?',
    messageTags: NO_TEXT_TAGS,
    requesterName: 'Fern Somsak',
    requesterPhotoUrl: null,
    requesterInactive: false,
    onWorkspaceFeed: false,
    askedAt: '2026-10-20T06:20:00.000Z',
    status: 'PENDING',
  },
];

export const PREVIEW_RECEIVED: readonly FeedItem[] = [
  {
    id: 'preview-received-0',
    giverName: 'Dao Rattana',
    giverPhotoUrl: null,
    giverInactive: false,
    giverIsYou: false,
    receivers: [PREVIEW_YOU, named('Nok Chaiyo'), named('Fern Somsak')],
    origin: 'OFFERED',
    message:
      'Your onboarding notes answered every question our new designer had. She shipped her first screen on day three. Thank you!',
    messageTags: NO_TEXT_TAGS,
    givenAt: '2026-10-20T09:30:00.000Z',
    reactions: {},
    request: null,
  },
  {
    id: 'preview-received-1',
    giverName: 'Arm Wattana',
    giverPhotoUrl: null,
    giverInactive: false,
    giverIsYou: false,
    receivers: [PREVIEW_YOU],
    origin: 'REQUESTED',
    message: PITCH_ANSWER,
    messageTags: NO_TEXT_TAGS,
    givenAt: '2026-10-20T03:40:00.000Z',
    reactions: {},
    request: {
      message: PITCH_QUESTION,
      messageTags: NO_TEXT_TAGS,
      requester: PREVIEW_YOU,
      asked: [named('Arm Wattana')],
    },
  },
  {
    id: 'preview-received-2',
    giverName: 'Nok Chaiyo',
    giverPhotoUrl: null,
    giverInactive: false,
    giverIsYou: false,
    receivers: [PREVIEW_YOU],
    origin: 'REQUESTED',
    message: MEETINGS_ANSWER,
    messageTags: NO_TEXT_TAGS,
    givenAt: '2026-10-19T04:15:00.000Z',
    reactions: {},
    request: {
      message: MEETINGS_QUESTION,
      messageTags: NO_TEXT_TAGS,
      requester: PREVIEW_YOU,
      asked: [named('Nok Chaiyo'), named('Fern Somsak')],
    },
  },
];
