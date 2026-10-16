import { readSharedFeedback } from '@/app/(signed-in)/(member)/home/_lib/shared-feedback.service';
import { FeedbackFeed } from '@/components/organisms/feedback-feed';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type SharedFeedbackListProps = {
  membership: CurrentMembership;
};

/** What teammates chose to show this person, read here so the tab renders around it. */
export async function SharedFeedbackList({
  membership,
}: SharedFeedbackListProps) {
  const shared = await readSharedFeedback(membership);
  return (
    <FeedbackFeed
      items={shared}
      emptyMessage="Nobody has shared Feedback with you yet."
    />
  );
}
