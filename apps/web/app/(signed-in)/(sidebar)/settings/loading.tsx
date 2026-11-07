import { AccountSectionSkeleton } from '@/app/(signed-in)/(sidebar)/settings/_components/account-section';
import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { SettingsSkeleton } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-skeleton';
import { ROUTES } from '@/lib/routes.constant';

/** Settings' landing while the session is read: Account's head, and its cards with the person's details in grey. */
export default function SettingsLoading() {
  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.account} />
      <SettingsSkeleton>
        <AccountSectionSkeleton />
      </SettingsSkeleton>
    </>
  );
}
