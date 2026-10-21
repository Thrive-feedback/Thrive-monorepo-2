import type { FeedItem } from '@/lib/feedback/feed-item.type';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import type { ReceivedFeedback } from '@/lib/feedback/received-feedback.type';
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
    slug: 'nok',
    displayName: 'Nok',
  },
  {
    accountId: 'preview-arm',
    name: 'Arm Wattana',
    slug: 'arm',
    displayName: 'Arm',
  },
  {
    accountId: 'preview-fern',
    name: 'Fern Somsak',
    slug: 'fern',
    displayName: 'Fern',
  },
  {
    accountId: 'preview-dao',
    name: 'Dao Rattana',
    slug: 'dao',
    displayName: 'Dao',
  },
];

export const PREVIEW_WORKSPACE_FEED: readonly FeedItem[] = [
  {
    id: 'preview-feed-1',
    giverName: 'Dao Rattana',
    giverInactive: false,
    receiverName: 'Nok Chaiyo',
    receiverInactive: false,
    origin: 'OFFERED',
    topic: 'A new hire’s first week',
    topicTags: NO_TEXT_TAGS,
    body: 'Your onboarding notes answered every question our new designer had. She shipped her first screen on day three. Thank you!',
    bodyTags: NO_TEXT_TAGS,
    givenAt: '2026-10-20T09:30:00.000Z',
    reactions: { '👏': ['Ploy Srisuk', 'Fern Somsak'], '❤️': ['Arm Wattana'] },
  },
  {
    id: 'preview-feed-2',
    giverName: 'Nok Chaiyo',
    giverInactive: false,
    receiverName: 'Ploy Srisuk',
    receiverInactive: false,
    origin: 'REQUESTED',
    topic:
      'I’m working on shorter meetings. Where did we lose time this morning?',
    topicTags: NO_TEXT_TAGS,
    body: 'We spent 20 minutes on a ticket nobody had read. Next time, share the board the day before.',
    bodyTags: NO_TEXT_TAGS,
    givenAt: '2026-10-19T04:15:00.000Z',
    reactions: { '💡': ['Arm Wattana'], '🙏': ['Ploy Srisuk'] },
  },
];

export const PREVIEW_SHARED_WITH_ME: readonly FeedItem[] = [
  {
    id: 'preview-shared-1',
    giverName: 'Arm Wattana',
    giverInactive: false,
    receiverName: 'Fern Somsak',
    receiverInactive: false,
    origin: 'REQUESTED',
    topic: 'In our run-through just now, where did you get lost?',
    topicTags: NO_TEXT_TAGS,
    body: 'The demo started before you explained the problem, so I didn’t know what I was looking at. Swap them.',
    bodyTags: NO_TEXT_TAGS,
    givenAt: '2026-10-20T07:45:00.000Z',
    reactions: {},
  },
];

export const PREVIEW_SENT_REQUESTS: readonly SentRequest[] = [
  {
    id: 'preview-request-1',
    topic:
      'In today’s pitch, what’s one thing I should change before the next one?',
    topicTags: NO_TEXT_TAGS,
    sentAt: '2026-10-20T03:10:00.000Z',
    asks: [
      {
        askId: 'preview-sent-ask-1',
        giverName: 'Arm Wattana',
        giverInactive: false,
        status: 'ANSWERED',
      },
    ],
  },
  {
    id: 'preview-request-2',
    topic:
      'I’m working on shorter meetings. Where did we lose time this morning?',
    topicTags: NO_TEXT_TAGS,
    sentAt: '2026-10-19T02:00:00.000Z',
    asks: [
      {
        askId: 'preview-sent-ask-2',
        giverName: 'Nok Chaiyo',
        giverInactive: false,
        status: 'ANSWERED',
      },
      {
        askId: 'preview-sent-ask-3',
        giverName: 'Fern Somsak',
        giverInactive: false,
        status: 'PENDING',
      },
    ],
  },
];

export const PREVIEW_WAITING_ASKS: readonly MyAsk[] = [
  {
    askId: 'preview-ask-1',
    topic: 'In our run-through just now, where did you get lost?',
    topicTags: NO_TEXT_TAGS,
    requesterName: 'Fern Somsak',
    requesterInactive: false,
    askedAt: '2026-10-20T06:20:00.000Z',
    status: 'PENDING',
  },
];

export const PREVIEW_RECEIVED: readonly ReceivedFeedback[] = [
  {
    id: 'preview-received-1',
    topic:
      'In today’s pitch, what’s one thing I should change before the next one?',
    topicTags: NO_TEXT_TAGS,
    offered: false,
    giverName: 'Arm Wattana',
    giverInactive: false,
    body: 'When you opened with market size, the room went quiet. When you told Mai’s story, they leaned in. Next time, open with the story.',
    bodyTags: NO_TEXT_TAGS,
    writtenAt: '2026-10-20T03:40:00.000Z',
  },
  {
    id: 'preview-received-2',
    topic:
      'I’m working on shorter meetings. Where did we lose time this morning?',
    topicTags: NO_TEXT_TAGS,
    offered: false,
    giverName: 'Nok Chaiyo',
    giverInactive: false,
    body: 'We spent 20 minutes on a ticket nobody had read. Next time, share the board the day before.',
    bodyTags: NO_TEXT_TAGS,
    writtenAt: '2026-10-19T04:15:00.000Z',
  },
];
