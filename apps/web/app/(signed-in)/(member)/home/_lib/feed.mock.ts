import type { FeedItem } from '@/lib/feedback/feed-item.type';

/*
 * PREVIEW DATA. The API has no Workspace feed yet, so that tab shows these made-up items. This
 * function stands where a `server-only` read will go; #90 replaces it and deletes this file.
 */

const WORKSPACE_FEED: readonly FeedItem[] = [
  {
    id: 'preview-1',
    giverName: 'Ben Carter',
    receiverName: 'Cara Diaz',
    origin: 'OFFERED',
    topic: 'The customer demo on Tuesday',
    body: 'You kept the demo calm when the staging server went down — switching to the recorded flow without missing a beat kept the customer with us. Next time, telling them up front that it was a recording would make it even smoother.',
    givenAt: '2026-10-12T09:30:00.000Z',
    reactions: { '👏': ['Ann Lee', 'Dan Evans'], '💡': ['Eve Fox'] },
  },
  {
    id: 'preview-2',
    giverName: 'Dan Evans',
    receiverName: 'Ann Lee',
    origin: 'REQUESTED',
    topic: 'Running the planning meeting',
    body: 'Starting with the three goals on one slide made it easy to say no to the side topics. I would leave ten minutes at the end for open questions — a few of us had things we did not get to raise.',
    givenAt: '2026-10-10T04:15:00.000Z',
    reactions: { '🙏': ['Ann Lee'], '❤️': ['Ben Carter', 'Cara Diaz'] },
  },
  {
    id: 'preview-3',
    giverName: 'Eve Fox',
    receiverName: 'Ben Carter',
    origin: 'OFFERED',
    topic: 'Onboarding the new designers',
    body: 'Your onboarding notes answered every question I had in my first week. Thank you for writing them down instead of only explaining them out loud.',
    givenAt: '2026-10-08T11:00:00.000Z',
    reactions: {},
  },
];

/** Feedback whose Visibility is Everyone in the Workspace, newest first. */
export function previewWorkspaceFeed(): readonly FeedItem[] {
  return WORKSPACE_FEED;
}
