import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/session/session.service';
import { InviteTeammatesCard } from './_components/invite-teammates-card';
import { InviteTeammatesHero } from './_components/invite-teammates-hero';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Invite your teammates',
  robots: { index: false, follow: false },
};

/**
 * The check is in the page, not a layout, because a layout does not re-run when the client
 * navigates between the pages under it.
 */
export default async function InviteTeammatesPage() {
  const session = await readSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="m-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-12">
      <InviteTeammatesHero />
      <InviteTeammatesCard />
    </div>
  );
}
