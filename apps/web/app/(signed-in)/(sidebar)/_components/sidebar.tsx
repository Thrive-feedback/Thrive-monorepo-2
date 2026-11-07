import { toSessionWriter } from '@/app/(signed-in)/(sidebar)/_lib/postcard-writer.util';
import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWaitingCount } from '@/lib/feedback/waiting-count.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import { requireMember } from '@/lib/session/session.service';
import { ComposeMenu } from './compose-menu';
import { SidebarNav } from './sidebar-nav';

/**
 * The sidebar beside Home and its pages: "+" to write something, then where to go. Who a
 * postcard can be for, who signs it, and what `@` and `#` offer on it are read here, so "+" can
 * hand them over.
 */
export async function Sidebar() {
  const session = await requireMember();
  const { membership, email } = session;
  const [waitingCount, teammates, workspaceGoals] = await Promise.all([
    readWaitingCount(membership),
    readTeammates(membership, email),
    readWorkspaceGoalNames(membership),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <ComposeMenu
        workspaceId={membership.workspace.id}
        teammates={teammates}
        workspaceGoals={workspaceGoals}
        writer={toSessionWriter(session)}
      />
      <SidebarNav waitingCount={waitingCount} />
    </div>
  );
}
