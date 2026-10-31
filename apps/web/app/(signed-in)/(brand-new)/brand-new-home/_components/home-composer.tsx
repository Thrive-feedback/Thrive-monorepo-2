import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import type { MemberAccount } from '@/lib/session/session.service';
import { HomeComposerPanel } from './home-composer-panel';

export type HomeComposerProps = {
  session: MemberAccount;
};

/** The composer, with who `@` and `#` can offer read here, as the sidebar reads them. */
export async function HomeComposer({ session }: HomeComposerProps) {
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
      writer={{
        name: session.profile.displayName,
        photoUrl: session.photoUrl,
      }}
    />
  );
}
