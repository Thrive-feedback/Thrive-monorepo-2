import { SkeletonRegion } from '@/components/atoms/skeleton';
import { WorkspaceGoalListSkeleton } from './_components/workspace-goal-list';

/** Workspace Goals while the session is read: the list in grey, under the pane's heading. */
export default function WorkspaceGoalsLoading() {
  return (
    <SkeletonRegion>
      <WorkspaceGoalListSkeleton />
    </SkeletonRegion>
  );
}
