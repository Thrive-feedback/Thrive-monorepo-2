import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { SettingsSkeleton } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-skeleton';
import { AppearanceSectionSkeleton } from '@/app/(signed-in)/(sidebar)/settings/appearance/_components/appearance-section';
import { ROUTES } from '@/lib/routes.constant';

/** Appearance while the session is read: its head, and the Theme row with its picker in grey. */
export default function AppearanceLoading() {
  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.appearance} />
      <SettingsSkeleton>
        <AppearanceSectionSkeleton />
      </SettingsSkeleton>
    </>
  );
}
