import { AccountSectionSkeleton } from '@/app/(signed-in)/(sidebar)/settings/_components/account-section';
import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { SettingsSkeleton } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-skeleton';
import { ROUTES } from '@/lib/routes.constant';

/** Account while the session is read: its head, and its cards with the person's details in grey. */
export default function AccountLoading() {
  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.account} />
      <SettingsSkeleton>
        <AccountSectionSkeleton />
      </SettingsSkeleton>
    </>
  );
}
