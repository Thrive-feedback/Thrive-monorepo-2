import { SkeletonRegion } from '@/components/atoms/skeleton';
import { WorkspaceSectionSkeleton } from './_components/workspace-section';

/** Workspace while the session is read: its rows, labelled, with what they hold in grey. */
export default function WorkspaceLoading() {
  return (
    <SkeletonRegion>
      <WorkspaceSectionSkeleton />
    </SkeletonRegion>
  );
}
