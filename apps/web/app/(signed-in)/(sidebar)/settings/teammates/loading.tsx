import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { SettingsSkeleton } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-skeleton';
import { MemberListCardSkeleton } from '@/app/(signed-in)/(sidebar)/settings/teammates/_components/member-list-card';
import { ROUTES } from '@/lib/routes.constant';

/** Teammates while the session is read: its head, and the people in grey. Whether to offer Invite people waits on the Role. */
export default function TeammatesLoading() {
  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.teammates} />
      <SettingsSkeleton>
        <MemberListCardSkeleton />
      </SettingsSkeleton>
    </>
  );
}
