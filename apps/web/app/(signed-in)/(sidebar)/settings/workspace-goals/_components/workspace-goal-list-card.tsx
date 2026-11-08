import { SettingsCard } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-card';
import { WorkspaceGoalListSkeleton } from './workspace-goal-list';

export type WorkspaceGoalListCardProps = {
  /** Named once it is known; the card waiting on the session says only "your Workspace". */
  workspaceName?: string;
  /** At the end of the title's row, such as Add a Workspace Goal for an Admin. */
  action?: React.ReactNode;
  children: React.ReactNode;
};

/** The card the Workspace Goals are listed in, loading or not. */
export function WorkspaceGoalListCard({
  workspaceName,
  action,
  children,
}: WorkspaceGoalListCardProps) {
  return (
    <SettingsCard
      title="Workspace Goals"
      description={`What ${workspaceName ?? 'your Workspace'} cares about, as hashtags.`}
      action={action}
    >
      {children}
    </SettingsCard>
  );
}

/** The Goals card while the session is read, before anyone knows which Workspace it is for. */
export function WorkspaceGoalListCardSkeleton() {
  return (
    <WorkspaceGoalListCard>
      <WorkspaceGoalListSkeleton />
    </WorkspaceGoalListCard>
  );
}
