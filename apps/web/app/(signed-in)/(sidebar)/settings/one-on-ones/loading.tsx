import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { SettingsSkeleton } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-skeleton';
import { TemplateLibrarySkeleton } from '@/app/(signed-in)/(sidebar)/settings/one-on-ones/_components/template-library-skeleton';
import { ROUTES } from '@/lib/routes.constant';

/** 1:1s while the templates are read: its head, and its cards in grey. */
export default function OneOnOneSettingsLoading() {
  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.oneOnOnes} />
      <SettingsSkeleton>
        <TemplateLibrarySkeleton />
      </SettingsSkeleton>
    </>
  );
}
