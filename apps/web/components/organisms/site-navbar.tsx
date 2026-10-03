import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { Logo } from '@/components/atoms/logo';
import {
  readSession,
  readSessionNeedsRefresh,
} from '@/lib/session/session.service';
import { signOut } from '@/lib/session/session-actions.service';
import { SessionRefresher } from './session-refresher';

/**
 * The logo, and Sign out for whoever is signed in. It is on every signed-in page, so it is
 * also where a session due a refresh gets one. The design also draws "Log in" and
 * "Create Organization" here; they are left out on purpose, because sign-in is the page
 * itself and creating an organization is not offered.
 *
 * Signing out sets a cookie from a server action, which makes Next render this layout again,
 * so the button disappears without a full reload.
 */
export async function SiteNavbar() {
  const [session, needsRefresh] = await Promise.all([
    readSession(),
    readSessionNeedsRefresh(),
  ]);

  return (
    <header className="flex h-18 shrink-0 items-center justify-between px-4 md:px-10">
      <Link href="/" className="rounded-control">
        <Logo />
      </Link>
      {needsRefresh && <SessionRefresher />}
      {session && (
        <form action={signOut}>
          <Button type="submit" size="sm">
            Sign out
          </Button>
        </form>
      )}
    </header>
  );
}
