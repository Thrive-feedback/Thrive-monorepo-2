import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { SettingsSkeleton } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-skeleton';
import { WorkspaceGoalListCardSkeleton } from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_components/workspace-goal-list-card';
import { ROUTES } from '@/lib/routes.constant';

/** Workspace Goals while the session is read: its head, and the list in grey. */
export default function WorkspaceGoalsLoading() {
  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.workspaceGoals} />
      <SettingsSkeleton>
        <WorkspaceGoalListCardSkeleton />
      </SettingsSkeleton>
    </>
  );
}
