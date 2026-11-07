import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SettingsCard } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-card';
import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { AddWorkspaceGoalForm } from './_components/add-workspace-goal-form';
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
 * means; Admins also see the hidden ones, hide and show them, and add more in a card of its own
 * under the list.
 */
export default async function WorkspaceGoals() {
  const session = await requireMember();
  const canManage = mayManageWorkspaceGoals(session.membership);

  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.workspaceGoals} />
      <WorkspaceGoalListCard workspaceName={session.membership.workspace.name}>
        <Suspense fallback={<WorkspaceGoalListSkeleton />}>
          <WorkspaceGoalList membership={session.membership} />
        </Suspense>
      </WorkspaceGoalListCard>
      {canManage && (
        <SettingsCard title="Add a Workspace Goal">
          <div className="py-4">
            <AddWorkspaceGoalForm
              workspaceId={session.membership.workspace.id}
            />
          </div>
        </SettingsCard>
      )}
    </>
  );
}
