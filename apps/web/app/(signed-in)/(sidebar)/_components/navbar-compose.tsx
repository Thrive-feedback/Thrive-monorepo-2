import { toSessionWriter } from '@/app/(signed-in)/(sidebar)/_lib/postcard-writer.util';
import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import { requireMember } from '@/lib/session/session.service';
import { ComposeDrawer } from './compose-drawer';

/**
 * The phone's "+", in the navbar beside the bell, where the sidebar's own "+" cannot be seen. It is
 * not in the menu drawer, because a card opened from there would close with the drawer. What it
 * reads, the sidebar reads too, and both reads are one per request.
 */
export async function NavbarCompose() {
  const session = await requireMember();
  const { membership, email } = session;
  const [teammates, workspaceGoals] = await Promise.all([
    readTeammates(membership, email),
    readWorkspaceGoalNames(membership),
  ]);

  return (
    <div className="md:hidden">
      <ComposeDrawer
        workspaceId={membership.workspace.id}
        teammates={teammates}
        workspaceGoals={workspaceGoals}
        writer={toSessionWriter(session)}
      />
    </div>
  );
}
