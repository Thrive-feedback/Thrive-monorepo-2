import { answerAsk } from '@/app/(signed-in)/(member)/home/_lib/answer-ask-actions.service';
import { readFeedbackAsk } from '@/app/(signed-in)/(member)/home/_lib/feedback-ask.service';
import { readWorkspaceGoalNames } from '@/app/(signed-in)/(member)/home/_lib/workspace-goal-names.service';
import { AnswerAskView } from '@/components/organisms/answer-ask-view';
import { readTeammates } from '@/lib/feedback/teammates.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';

export type AnswerAskDetailProps = {
  membership: CurrentMembership;
  /** Who is answering, so they are not offered to mention themselves. */
  ownEmail: string;
  askId: string;
};

/**
 * The Ask open over Home, read on every open, so what was written shows after a refresh rather
 * than only in the form that sent it. The answer goes to the API through `answerAsk`.
 */
export async function AnswerAskDetail({
  membership,
  ownEmail,
  askId,
}: AnswerAskDetailProps) {
  const [ask, teammates, workspaceGoals] = await Promise.all([
    readFeedbackAsk(membership, askId),
    readTeammates(membership, ownEmail),
    readWorkspaceGoalNames(membership),
  ]);
  return (
    <AnswerAskView
      ask={ask}
      teammates={teammates}
      workspaceGoals={workspaceGoals}
      action={answerAsk.bind(null, membership.workspace.id)}
    />
  );
}
