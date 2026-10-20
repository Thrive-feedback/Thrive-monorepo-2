import { giveFeedback } from '@/app/(signed-in)/(member)/home/_lib/give-feedback-actions.service';
import { requestFeedback } from '@/app/(signed-in)/(member)/home/_lib/request-feedback-actions.service';
import { readTeammates } from '@/app/(signed-in)/(member)/home/_lib/teammates.service';
import { readWorkspaceGoalNames } from '@/app/(signed-in)/(member)/home/_lib/workspace-goal-names.service';
import { FeedbackComposer } from '@/components/organisms/feedback-composer';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type FeedbackComposerCardProps = {
  membership: CurrentMembership;
  ownEmail: string;
};

/**
 * The top of Home: asking for Feedback or giving it. Reads who can be asked, given to or
 * mentioned, and the Workspace Goals `#` offers, on the server, once, and hands both forms plain
 * data.
 */
export async function FeedbackComposerCard({
  membership,
  ownEmail,
}: FeedbackComposerCardProps) {
  const [teammates, workspaceGoals] = await Promise.all([
    readTeammates(membership, ownEmail),
    readWorkspaceGoalNames(membership),
  ]);

  return (
    <FeedbackComposer
      teammates={teammates}
      workspaceGoals={workspaceGoals}
      requestAction={requestFeedback.bind(null, membership.workspace.id)}
      giveAction={giveFeedback.bind(null, membership.workspace.id)}
    />
  );
}
