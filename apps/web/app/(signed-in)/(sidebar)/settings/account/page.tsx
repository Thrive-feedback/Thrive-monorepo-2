import type { Metadata } from 'next';
import { AccountSection } from '@/app/(signed-in)/(sidebar)/settings/_components/account-section';
import { SettingsSectionHead } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-section-head';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
};

/** The person's own Profile, and Sign out. */
export default async function Account() {
  const session = await requireMember();

  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.account} />
      <AccountSection session={session} />
    </>
  );
}
