import { readFeedback } from '@/app/(signed-in)/(member)/home/_lib/feedback.service';
import { Text } from '@/components/atoms/text';
import { FeedbackCard } from '@/components/organisms/feedback-card';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type FeedbackDetailProps = {
  membership: CurrentMembership;
  feedbackId: string;
};

/**
 * One piece of Feedback, on the card the feeds already use, so following a link to it shows the
 * same thing the person would have found by scrolling to it. It is read on every open, so what
 * Visibility allows now is what is shown.
 *
 * An id this Workspace has no readable Feedback for says so in the dialog rather than turning
 * Home into a 404; that is also the answer for Feedback the caller may not read.
 */
export async function FeedbackDetail({
  membership,
  feedbackId,
}: FeedbackDetailProps) {
  const feedback = await readFeedback(membership, feedbackId);
  if (!feedback) {
    return (
      <Text variant="body-2" tone="muted">
        This Feedback isn&apos;t here any more.
      </Text>
    );
  }

  return <FeedbackCard item={feedback} />;
}
