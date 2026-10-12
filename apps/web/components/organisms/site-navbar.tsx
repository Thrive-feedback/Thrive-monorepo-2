import { Text } from '@/components/atoms/text';
import { NavbarLogo } from '@/components/molecules/navbar-logo';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import {
  readSession,
  readSessionNeedsRefresh,
} from '@/lib/session/session.service';
import { SessionRefresher } from './session-refresher';
import { SignOutForm } from './sign-out-form';

/**
 * The logo (left out on the sign-in page, which shows its own), the light/dark switch, and,
 * while signed in, the address they signed in with and Sign out. It is on every signed-in page
 * but Home, which draws the same items as a side nav (`SiteSideNav`), so the two are where a
 * session due a refresh gets one. The design also draws "Log in" and "Create Organization"
 * here; they are left out on purpose, because sign-in is the page itself and creating an
 * organization is not offered.
 */
export async function SiteNavbar() {
  const [session, needsRefresh] = await Promise.all([
    readSession(),
    readSessionNeedsRefresh(),
  ]);

  return (
    <header className="flex h-18 shrink-0 items-center justify-between px-inset-container">
      <NavbarLogo />
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
    </header>
  );
}
