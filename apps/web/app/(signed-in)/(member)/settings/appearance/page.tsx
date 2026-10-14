import type { Metadata } from 'next';
import { Text } from '@/components/atoms/text';
import { ThemePicker } from '@/components/molecules/theme-picker';
import { requireMember } from '@/lib/session/session.service';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Appearance',
  robots: { index: false, follow: false },
};

/** The colour mode, kept in this browser rather than on the account. */
export default async function Appearance() {
  await requireMember();

  return (
    <section className="flex flex-col gap-6">
      <Text variant="subtitle-1" as="h2">
        Appearance
      </Text>
      <div className="flex flex-col gap-3 rounded-page bg-surface-raised p-6">
        <Text as="h3" variant="subtitle-4">
          Theme
        </Text>
        <Text as="p" variant="body-3" tone="muted">
          System follows your device's light or dark setting. Your choice is
          saved in this browser.
        </Text>
        <ThemePicker />
      </div>
    </section>
  );
}
