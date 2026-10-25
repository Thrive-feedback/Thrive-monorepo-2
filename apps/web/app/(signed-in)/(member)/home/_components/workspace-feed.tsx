import { readWorkspaceFeed } from '@/app/(signed-in)/(member)/home/_lib/workspace-feed.service';
import { readWorkspaceKudos } from '@/app/(signed-in)/(member)/home/_lib/workspace-kudos.service';
import { FeedbackFeed } from '@/components/organisms/feedback-feed';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type WorkspaceFeedProps = {
  membership: CurrentMembership;
};

/**
 * What the Workspace shared with everybody in it — Feedback set to Everyone, and every Kudos —
 * read here, both at once, so the feed renders around them.
 */
export async function WorkspaceFeed({ membership }: WorkspaceFeedProps) {
  const [feed, kudos] = await Promise.all([
    readWorkspaceFeed(membership),
    readWorkspaceKudos(membership),
  ]);
  return (
    <FeedbackFeed
      items={feed}
      kudos={kudos}
      emptyMessage="Nothing has been shared with everyone yet."
    />
  );
}
