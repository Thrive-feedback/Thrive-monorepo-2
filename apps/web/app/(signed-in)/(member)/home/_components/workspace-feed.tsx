import { readWorkspaceFeed } from '@/app/(signed-in)/(member)/home/_lib/workspace-feed.service';
import { FeedbackFeed } from '@/components/organisms/feedback-feed';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type WorkspaceFeedProps = {
  membership: CurrentMembership;
};

/** What the Workspace shared with everybody in it, read here so the feed renders around it. */
export async function WorkspaceFeed({ membership }: WorkspaceFeedProps) {
  const feed = await readWorkspaceFeed(membership);
  return (
    <FeedbackFeed
      items={feed}
      emptyMessage="Nothing has been shared with everyone yet."
    />
  );
}
