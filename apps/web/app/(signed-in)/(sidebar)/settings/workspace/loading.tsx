import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { SettingsSkeleton } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-skeleton';
import { WorkspaceSectionSkeleton } from '@/app/(signed-in)/(sidebar)/settings/workspace/_components/workspace-section';
import { ROUTES } from '@/lib/routes.constant';

/** Workspace while the session is read: its head, and its cards' rows labelled with what they hold in grey. */
export default function WorkspaceLoading() {
  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.workspace} />
      <SettingsSkeleton>
        <WorkspaceSectionSkeleton />
      </SettingsSkeleton>
    </>
  );
}
