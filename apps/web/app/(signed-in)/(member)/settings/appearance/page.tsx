import type { Metadata } from 'next';
import { ThemePicker } from '@/components/molecules/theme-picker';
import { requireMember } from '@/lib/session/session.service';
import { SettingRow } from '../_components/setting-row';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Appearance',
  robots: { index: false, follow: false },
};

/** The colour mode, kept in this browser rather than on the account. */
export default async function Appearance() {
  await requireMember();

  return (
    <section>
      <SettingRow
        label="Theme"
        description="System follows your device's light or dark setting. Your choice is saved in this browser."
      >
        <ThemePicker />
      </SettingRow>
    </section>
  );
}
