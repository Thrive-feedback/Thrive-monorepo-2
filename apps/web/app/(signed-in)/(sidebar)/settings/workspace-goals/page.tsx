import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { AddWorkspaceGoal } from './_components/add-workspace-goal';
import {
  WorkspaceGoalList,
  WorkspaceGoalListSkeleton,
} from './_components/workspace-goal-list';
import { WorkspaceGoalListCard } from './_components/workspace-goal-list-card';
import { mayManageWorkspaceGoals } from './_lib/workspace-goal-access.util';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Goals',
  robots: { index: false, follow: false },
};

/**
 * What the Workspace cares about, as hashtags. Every Member reads the active ones with what each
 * means; Admins also see the hidden ones, hide and show them, and add more from the end of the
 * card's title, in a dialog, as Invite people is offered on Teammates.
 */
export default async function WorkspaceGoals() {
  const session = await requireMember();
  const canManage = mayManageWorkspaceGoals(session.membership);

  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.workspaceGoals} />
      <WorkspaceGoalListCard
        workspaceName={session.membership.workspace.name}
        action={
          canManage && (
            <AddWorkspaceGoal workspaceId={session.membership.workspace.id} />
          )
        }
      >
        <Suspense fallback={<WorkspaceGoalListSkeleton />}>
          <WorkspaceGoalList membership={session.membership} />
        </Suspense>
      </WorkspaceGoalListCard>
    </>
  );
}
