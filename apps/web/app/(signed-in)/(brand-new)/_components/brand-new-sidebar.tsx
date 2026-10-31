import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWaitingCount } from '@/lib/feedback/waiting-count.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import { requireMember } from '@/lib/session/session.service';
import { BrandNewSideNav } from './brand-new-side-nav';
import { ComposeMenu } from './compose-menu';

/**
 * The new Home's sidebar: "+" to write something, then where to go. Who a postcard can be for, who
 * signs it, and what `@` and `#` offer on it are read here, so "+" can hand them over.
 */
export async function BrandNewSidebar() {
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
        writer={{
          name: session.profile.displayName,
          photoUrl: session.photoUrl,
        }}
      />
      <BrandNewSideNav waitingCount={waitingCount} />
    </div>
  );
}
