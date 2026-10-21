import { Text } from '@/components/atoms/text';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import {
  readSession,
  readSessionNeedsRefresh,
} from '@/lib/session/session.service';
import { NavbarFrame } from './navbar-frame';
import { SessionRefresher } from './session-refresher';
import { SignOutForm } from './sign-out-form';

/**
 * The logo, the light/dark switch, and, while signed in, the address they signed in with and
 * Sign out. It is on the invitation pages and on Register; sign-in has no navbar, and a Member's
 * pages draw `MemberNavbar` instead, so the two are where a session due a refresh gets one. The
 * design also draws "Log in" and "Create Organization" here; they are left out on purpose,
 * because sign-in is the page itself and creating an organization is not offered.
 */
export async function SiteNavbar() {
  const [session, needsRefresh] = await Promise.all([
    readSession(),
    readSessionNeedsRefresh(),
  ]);

  return (
    <NavbarFrame>
      {needsRefresh && <SessionRefresher />}
      <div className="flex min-w-0 items-center gap-gap-nav">
        <ThemeToggle />
        {session && (
          <>
            <Text as="span" variant="body-2" tone="muted" className="truncate">
              {session.email}
            </Text>
            <SignOutForm />
          </>
        )}
      </div>
    </NavbarFrame>
  );
}
