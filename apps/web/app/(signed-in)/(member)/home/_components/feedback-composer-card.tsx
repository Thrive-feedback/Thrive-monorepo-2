import { giveFeedback } from '@/app/(signed-in)/(member)/home/_lib/give-feedback-actions.service';
import { giveKudos } from '@/app/(signed-in)/(member)/home/_lib/give-kudos-actions.service';
import { requestFeedback } from '@/app/(signed-in)/(member)/home/_lib/request-feedback-actions.service';
import { readWorkspaceGoalNames } from '@/app/(signed-in)/(member)/home/_lib/workspace-goal-names.service';
import { FeedbackComposer } from '@/components/organisms/feedback-composer';
import { readTeammates } from '@/lib/feedback/teammates.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type FeedbackComposerCardProps = {
  membership: CurrentMembership;
  ownEmail: string;
};

/**
 * The top of Home: asking for Feedback, giving it, or giving Kudos. Reads who can be asked, given to or
 * mentioned, and the Workspace Goals `#` offers, on the server, once, and hands the forms plain
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
      workspaceName={membership.workspace.name}
      requestAction={requestFeedback.bind(null, membership.workspace.id)}
      giveAction={giveFeedback.bind(null, membership.workspace.id)}
      kudosAction={giveKudos.bind(null, membership.workspace.id)}
    />
  );
}
