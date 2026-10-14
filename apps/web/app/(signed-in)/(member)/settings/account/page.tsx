import type { Metadata } from 'next';
import { requireMember } from '@/lib/session/session.service';
import { AccountSection } from '../_components/account-section';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
};

/** The person's own Profile, and Sign out. */
export default async function Account() {
  const session = await requireMember();

  return <AccountSection session={session} />;
}
