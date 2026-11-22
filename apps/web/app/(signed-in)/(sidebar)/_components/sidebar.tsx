import { toSessionWriter } from '@/app/(signed-in)/(sidebar)/_lib/postcard-writer.util';
import { cn } from '@/lib/cn.util';
import { readFeatureFlags } from '@/lib/feature-flags/feature-flags.service';
import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import { requireMember } from '@/lib/session/session.service';
import { ComposeMenu } from './compose-menu';
import styles from './sidebar.module.css';
import { SidebarAccount } from './sidebar-account';
import { SidebarColumn } from './sidebar-column';
import { SidebarDrawerContent } from './sidebar-drawer';
import { SidebarNav } from './sidebar-nav';

/**
 * The sidebar beside Home and its pages: "+" to write something, then where to go, and at its foot
 * Settings and who is signed in. A phone has no room for it beside the page, so there the same
 * places and foot open in the menu drawer from the navbar, and "+" stands in the navbar by the bell.
 * Who a postcard can be for, who signs it, and what `@` and `#` offer on it are read here for "+".
 * Which places are switched on is read here too, so the column and the drawer leave out the same
 * ones.
 */
export async function Sidebar() {
  const session = await requireMember();
  const { membership, email } = session;
  const [teammates, workspaceGoals, { showsDashboard }] = await Promise.all([
    readTeammates(membership, email),
    readWorkspaceGoalNames(membership),
    readFeatureFlags(),
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
            <SidebarNav showsDashboard={showsDashboard} />
          </div>
          <div className="mt-auto shrink-0">
            <SidebarAccount
              name={session.profile?.displayName ?? session.name}
              email={email}
              slug={session.profile.slug}
              photoUrl={session.photoUrl}
            />
          </div>
        </div>
      </SidebarColumn>
      <SidebarDrawerContent>
        <SidebarNav showsDashboard={showsDashboard} />
        <div className="mt-auto">
          <SidebarAccount
            name={session.profile?.displayName ?? session.name}
            email={email}
            slug={session.profile.slug}
            photoUrl={session.photoUrl}
          />
        </div>
      </SidebarDrawerContent>
    </>
  );
}
