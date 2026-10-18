import { SkeletonRegion } from '@/components/atoms/skeleton';
import { AccountSectionSkeleton } from '../_components/account-section';

/** Account while the session is read: its rows, labelled, with the person's details in grey. */
export default function AccountLoading() {
  return (
    <SkeletonRegion>
      <AccountSectionSkeleton />
    </SkeletonRegion>
  );
}
