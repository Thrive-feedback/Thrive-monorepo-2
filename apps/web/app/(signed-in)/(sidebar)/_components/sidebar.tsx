import { toSessionWriter } from '@/app/(signed-in)/(sidebar)/_lib/postcard-writer.util';
import { cn } from '@/lib/cn.util';
import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWaitingCount } from '@/lib/feedback/waiting-count.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import { requireMember } from '@/lib/session/session.service';
import { ComposeMenu } from './compose-menu';
import styles from './sidebar.module.css';
import { SidebarAccount } from './sidebar-account';
import { SidebarColumn } from './sidebar-column';
import { SidebarNav } from './sidebar-nav';
import { TabBar } from './tab-bar';

/**
 * The sidebar beside Home and its pages: "+" to write something, then where to go, and at its foot
 * Settings and who is signed in. A phone has no room for it, so the same places and "+" stand in a
 * tab bar along the bottom instead. Who a postcard can be for, who signs it, and what `@` and `#`
 * offer on it are read once here, so either "+" can hand them over.
 */
export async function Sidebar() {
  const session = await requireMember();
  const { membership, email } = session;
  const [waitingCount, teammates, workspaceGoals] = await Promise.all([
    readWaitingCount(membership),
    readTeammates(membership, email),
    readWorkspaceGoalNames(membership),
  ]);

  const compose = {
    workspaceId: membership.workspace.id,
    teammates,
    workspaceGoals,
    writer: toSessionWriter(session),
  };

  return (
    <>
      <SidebarColumn>
        <div className={cn('flex flex-col gap-4', styles.rail)}>
          {/* On a window too short for all of it, this part scrolls inside the rail so the foot stays
          in reach. The negative margin and matching padding leave room for a focus ring. */}
          <div className="-m-1 flex min-h-0 flex-col gap-4 overflow-y-auto p-1">
            <ComposeMenu {...compose} />
            <SidebarNav waitingCount={waitingCount} />
          </div>
          <div className="mt-auto shrink-0">
            <SidebarAccount
              name={session.profile?.displayName ?? session.name}
              email={email}
              photoUrl={session.photoUrl}
            />
          </div>
        </div>
      </SidebarColumn>
      <TabBar waitingCount={waitingCount}>
        <ComposeMenu {...compose} placement="tab-bar" />
      </TabBar>
    </>
  );
}
