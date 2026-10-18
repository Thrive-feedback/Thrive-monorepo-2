import { SkeletonRegion } from '@/components/atoms/skeleton';
import { AccountSectionSkeleton } from './_components/account-section';

/** Settings' landing while the session is read: the Account section it shows, in grey. */
export default function SettingsLoading() {
  return (
    <SkeletonRegion>
      <AccountSectionSkeleton />
    </SkeletonRegion>
  );
}
