import { NavbarLogo } from '@/components/molecules/navbar-logo';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import {
  readSession,
  readSessionNeedsRefresh,
} from '@/lib/session/session.service';
import { AccountAvatar } from './account-avatar';
import styles from './glass.module.css';
import { NotificationBell } from './notification-bell';
import { SessionRefresher } from './session-refresher';
import { SettingsLink } from './settings-link';

export type MemberNavbarProps = {
  /** Where the logo leads a signed-in person. */
  homeHref?: string;
  /** Drawn right after the logo. */
  children?: React.ReactNode;
};

/**
 * The navbar of every page a Member uses: the logo, leading Home, on the left; Settings and the
 * person's avatar on the right. The colour mode is chosen in Settings, so there is no switch
 * here. Register keeps `SiteNavbar`, because someone still registering has no Home to go to.
 * The bell is beside Settings, and only for somebody signed in: it asks the server what is
 * waiting for them, and there is nothing waiting for nobody.
 * This is where a session due a refresh gets one on a Member's pages.
 *
 * The new Home, built beside Home, passes its own `homeHref` for the logo, and the Workspace the
 * person is in as `children`, drawn right after the logo.
 */
export async function MemberNavbar({
  homeHref = ROUTES.home,
  children,
}: MemberNavbarProps = {}) {
  const [session, needsRefresh] = await Promise.all([
    readSession(),
    readSessionNeedsRefresh(),
  ]);
  const logo = <NavbarLogo href={session ? homeHref : ROUTES.landing} />;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 flex h-18 items-center justify-between gap-gap-nav px-inset-container',
        styles.glass,
        styles.curvesDown,
        styles.framed,
      )}
    >
      {children ? (
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {logo}
          {children}
        </div>
      ) : (
        logo
      )}
      {needsRefresh && <SessionRefresher />}
      <div className="flex items-center gap-gap-nav">
        {session && (
          <>
            <NotificationBell />
            <SettingsLink />
            <AccountAvatar
              name={session.profile?.displayName ?? session.name}
              email={session.email}
              photoUrl={session.photoUrl}
            />
          </>
        )}
      </div>
    </header>
  );
}
