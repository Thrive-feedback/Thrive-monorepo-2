import { toSessionWriter } from '@/app/(signed-in)/(sidebar)/_lib/postcard-writer.util';
import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import type { MemberAccount } from '@/lib/session/session.service';
import { HomeComposerPanel } from './home-composer-panel';

export type HomeComposerProps = {
  session: MemberAccount;
  /** A postcard is open over Home as it is reached, which keeps the cursor. */
  isUnderPostcard: boolean;
};

/** The composer, with who `@` and `#` can offer read here, as the sidebar reads them. */
export async function HomeComposer({
  session,
  isUnderPostcard,
}: HomeComposerProps) {
  const { membership, email } = session;
  const [teammates, workspaceGoals] = await Promise.all([
    readTeammates(membership, email),
    readWorkspaceGoalNames(membership),
  ]);

  return (
    <HomeComposerPanel
      workspaceId={membership.workspace.id}
      teammates={teammates}
      workspaceGoals={workspaceGoals}
      writer={toSessionWriter(session)}
      isUnderPostcard={isUnderPostcard}
    />
  );
}
