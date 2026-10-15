import { giveFeedback } from '@/app/(signed-in)/(member)/home/_lib/give-feedback-actions.service';
import { requestFeedback } from '@/app/(signed-in)/(member)/home/_lib/request-feedback-actions.service';
import { readTeammates } from '@/app/(signed-in)/(member)/home/_lib/teammates.service';
import { FeedbackComposer } from '@/components/organisms/feedback-composer';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type FeedbackComposerCardProps = {
  membership: CurrentMembership;
  ownEmail: string;
};

/**
 * The top of Home: asking for Feedback or giving it. Reads who can be asked or given to on the
 * server, once, and hands both forms plain data.
 */
export async function FeedbackComposerCard({
  membership,
  ownEmail,
}: FeedbackComposerCardProps) {
  const teammates = await readTeammates(membership, ownEmail);

  return (
    <FeedbackComposer
      teammates={teammates}
      requestAction={requestFeedback}
      giveAction={giveFeedback}
    />
  );
}
