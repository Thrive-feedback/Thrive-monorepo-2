import { NavbarLogo } from '@/components/molecules/navbar-logo';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import {
  readSession,
  readSessionNeedsRefresh,
} from '@/lib/session/session.service';
import { AccountMenu } from './account-menu';
import { MemberNavLinks } from './member-nav-links';
import { SessionRefresher } from './session-refresher';

/**
 * The navbar of every page a Member uses: the logo and Home on the left, the light/dark switch
 * and the account menu on the right. Register keeps `SiteNavbar`, because someone still
 * registering has no Home to go to. This is where a session due a refresh gets one on a
 * Member's pages.
 */
export async function MemberNavbar() {
  const [session, needsRefresh] = await Promise.all([
    readSession(),
    readSessionNeedsRefresh(),
  ]);

  return (
    <header className="flex h-18 shrink-0 items-center justify-between gap-gap-nav px-inset-container">
      <div className="flex items-center gap-gap-nav">
        <NavbarLogo />
        {session && <MemberNavLinks />}
      </div>
      {needsRefresh && <SessionRefresher />}
      <div className="flex items-center gap-gap-nav">
        <ThemeToggle />
        {session && (
          <AccountMenu
            name={session.profile?.displayName ?? session.name}
            email={session.email}
          />
        )}
      </div>
    </header>
  );
}
