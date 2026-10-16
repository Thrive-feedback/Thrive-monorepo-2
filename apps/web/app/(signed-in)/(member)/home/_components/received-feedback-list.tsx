import { readReceivedFeedback } from '@/app/(signed-in)/(member)/home/_lib/received-feedback.service';
import { ReceivedFeedbackListView } from '@/components/organisms/received-feedback-list-view';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type ReceivedFeedbackListProps = {
  membership: CurrentMembership;
};

/** Everything people have written to this person, read here so the page renders around it. */
export async function ReceivedFeedbackList({
  membership,
}: ReceivedFeedbackListProps) {
  const received = await readReceivedFeedback(membership);
  return <ReceivedFeedbackListView items={received} />;
}
