import type { Metadata } from 'next';
import { requireMember } from '@/lib/session/session.service';
import { AppearanceSection } from './_components/appearance-section';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Appearance',
  robots: { index: false, follow: false },
};

/** The colour mode, kept in this browser rather than on the account. */
export default async function Appearance() {
  await requireMember();

  return <AppearanceSection />;
}
