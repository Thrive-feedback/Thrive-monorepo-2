import { toSessionWriter } from '@/app/(signed-in)/(brand-new)/_lib/postcard-writer.util';
import { Text } from '@/components/atoms/text';
import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import type { MemberAccount } from '@/lib/session/session.service';
import { GiveFeedbackButton } from './give-feedback-button';

export type GivenEmptyProps = {
  session: MemberAccount;
};

/** Given with nothing in it, and the way to put something there, the one place it reads for a card. */
export async function GivenEmpty({ session }: GivenEmptyProps) {
  const { membership, email } = session;
  const [teammates, workspaceGoals] = await Promise.all([
    readTeammates(membership, email),
    readWorkspaceGoalNames(membership),
  ]);

  return (
    <div className="flex flex-col gap-3 py-5">
      <Text as="p" variant="subtitle-3">
        You haven&apos;t given any Feedback yet.
      </Text>
      <GiveFeedbackButton
        workspaceId={membership.workspace.id}
        teammates={teammates}
        workspaceGoals={workspaceGoals}
        writer={toSessionWriter(session)}
      />
    </div>
  );
}
