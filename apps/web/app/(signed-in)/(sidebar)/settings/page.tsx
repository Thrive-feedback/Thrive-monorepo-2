import type { Metadata } from 'next';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { AccountSection } from './_components/account-section';
import { SettingsSectionHead } from './_components/settings-section-head';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

/**
 * Settings' landing. A wide screen shows Account beside the menu, so there is never an empty
 * pane; a narrow one shows only the menu (`SettingsPanes`). Every Member may come here.
 */
export default async function Settings() {
  const session = await requireMember();

  return (
    <>
      <SettingsSectionHead href={ROUTES.settings.account} />
      <AccountSection session={session} />
    </>
  );
}
