import type { FeedItem } from './feed-item.type';

/*
 * PREVIEW DATA. The API has no Workspace feed, Shared with me or Offered Feedback yet, so these
 * tabs show these made-up items. Each function stands where a `server-only` read will go; swap
 * the body for an API call and delete this file once the endpoints exist.
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

const SHARED_WITH_ME: readonly FeedItem[] = [
  {
    id: 'preview-4',
    giverName: 'Cara Diaz',
    receiverName: 'Dan Evans',
    origin: 'REQUESTED',
    topic: 'My first month as team lead',
    body: 'You make time for one-to-ones even in busy weeks, and it shows. When priorities change, writing the reason in the channel would help the people who were not in the room.',
    givenAt: '2026-10-11T07:45:00.000Z',
    reactions: {},
  },
];

/** Feedback whose Visibility is Everyone in the Workspace, newest first. */
export function previewWorkspaceFeed(): readonly FeedItem[] {
  return WORKSPACE_FEED;
}

/** Feedback shared with the signed-in person as one of the Selected people, newest first. */
export function previewSharedWithMe(): readonly FeedItem[] {
  return SHARED_WITH_ME;
}
