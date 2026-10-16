import type { FeedItem } from '@/lib/feedback/feed-item.type';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import type { ReceivedFeedback } from '@/lib/feedback/received-feedback.type';
import type { SentRequest } from '@/lib/feedback/sent-request.type';
import type { Teammate } from '@/lib/feedback/teammate.type';

/*
 * MADE-UP DATA for the landing page's preview of Home. Nobody here is real and nothing in the
 * preview reaches the API. The visitor is Ploy, a founder, in her own Workspace.
 */

export const PREVIEW_WORKSPACE_NAME = 'Sunrise Studio';

export const PREVIEW_TEAMMATES: readonly Teammate[] = [
  { accountId: 'preview-nok', name: 'Nok Chaiyo' },
  { accountId: 'preview-arm', name: 'Arm Wattana' },
  { accountId: 'preview-fern', name: 'Fern Somsak' },
];

export const PREVIEW_WORKSPACE_FEED: readonly FeedItem[] = [
  {
    id: 'preview-feed-1',
    giverName: 'Nok Chaiyo',
    receiverName: 'Arm Wattana',
    origin: 'OFFERED',
    topic: 'The client demo on Tuesday',
    body: 'You stayed calm when the demo server went down and switched to the recording without missing a beat. Next time, telling the client up front that it is a recording would make it even smoother.',
    givenAt: '2026-10-14T09:30:00.000Z',
    reactions: { '👏': ['Ploy Srisuk', 'Fern Somsak'], '💡': ['Arm Wattana'] },
  },
  {
    id: 'preview-feed-2',
    giverName: 'Arm Wattana',
    receiverName: 'Ploy Srisuk',
    origin: 'REQUESTED',
    topic: 'How I ran Monday’s sprint planning',
    body: 'Keep the five-minute recap at the start. Next time, share the agenda the day before so we can come prepared.',
    givenAt: '2026-10-13T04:15:00.000Z',
    reactions: { '🙏': ['Ploy Srisuk'], '❤️': ['Nok Chaiyo'] },
  },
  {
    id: 'preview-feed-3',
    giverName: 'Fern Somsak',
    receiverName: 'Nok Chaiyo',
    origin: 'OFFERED',
    topic: 'Onboarding the new designer',
    body: 'Your onboarding notes answered every question I had in my first week. Thank you for writing them down instead of only explaining them out loud.',
    givenAt: '2026-10-10T11:00:00.000Z',
    reactions: {},
  },
];

export const PREVIEW_SHARED_WITH_ME: readonly FeedItem[] = [
  {
    id: 'preview-shared-1',
    giverName: 'Fern Somsak',
    receiverName: 'Arm Wattana',
    origin: 'REQUESTED',
    topic: 'My first month as team lead',
    body: 'You make time for one-to-ones even in busy weeks, and it shows. When priorities change, writing the reason in the channel would help the people who were not in the room.',
    givenAt: '2026-10-12T07:45:00.000Z',
    reactions: {},
  },
];

export const PREVIEW_SENT_REQUESTS: readonly SentRequest[] = [
  {
    id: 'preview-request-1',
    topic: 'How I ran Monday’s sprint planning',
    sentAt: '2026-10-12T02:00:00.000Z',
    asks: [
      {
        askId: 'preview-sent-ask-1',
        giverName: 'Arm Wattana',
        status: 'ANSWERED',
      },
      {
        askId: 'preview-sent-ask-2',
        giverName: 'Nok Chaiyo',
        status: 'PENDING',
      },
    ],
  },
];

export const PREVIEW_WAITING_ASKS: readonly MyAsk[] = [
  {
    askId: 'preview-ask-1',
    topic: 'The pricing page draft',
    requesterName: 'Nok Chaiyo',
    askedAt: '2026-10-15T03:20:00.000Z',
    status: 'PENDING',
  },
  {
    askId: 'preview-ask-2',
    topic: 'My first customer call',
    requesterName: 'Fern Somsak',
    askedAt: '2026-10-14T08:10:00.000Z',
    status: 'PENDING',
  },
];

export const PREVIEW_RECEIVED: readonly ReceivedFeedback[] = [
  {
    id: 'preview-received-1',
    topic: 'How I ran Monday’s sprint planning',
    giverName: 'Arm Wattana',
    body: 'Keep the five-minute recap at the start. Next time, share the agenda the day before so we can come prepared.',
    writtenAt: '2026-10-13T04:15:00.000Z',
  },
];
