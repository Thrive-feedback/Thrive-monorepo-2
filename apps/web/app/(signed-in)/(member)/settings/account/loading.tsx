import { AccountSectionSkeleton } from '@/app/(signed-in)/(member)/settings/_components/account-section';
import { SkeletonRegion } from '@/components/atoms/skeleton';

/** Account while the session is read: its rows, labelled, with the person's details in grey. */
export default function AccountLoading() {
  return (
    <SkeletonRegion>
      <AccountSectionSkeleton />
    </SkeletonRegion>
  );
}
