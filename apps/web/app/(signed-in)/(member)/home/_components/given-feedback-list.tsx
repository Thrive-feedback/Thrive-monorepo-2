import { readGivenFeedback } from '@/app/(signed-in)/(member)/home/_lib/given-feedback.service';
import { GivenFeedbackListView } from '@/components/organisms/given-feedback-list-view';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type GivenFeedbackListProps = {
  membership: CurrentMembership;
};

/** Everything this person has written to others, read here so the page renders around it. */
export async function GivenFeedbackList({
  membership,
}: GivenFeedbackListProps) {
  const given = await readGivenFeedback(membership);
  return <GivenFeedbackListView items={given} />;
}
