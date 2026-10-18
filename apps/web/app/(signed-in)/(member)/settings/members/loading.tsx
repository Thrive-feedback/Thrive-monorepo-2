import { SkeletonRegion } from '@/components/atoms/skeleton';
import { MemberListSkeleton } from './_components/member-list';

/** Members while the session is read: the list of people in grey, under the pane's heading. */
export default function MembersLoading() {
  return (
    <SkeletonRegion>
      <MemberListSkeleton />
    </SkeletonRegion>
  );
}
