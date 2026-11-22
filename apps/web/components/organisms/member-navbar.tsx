import { cva } from 'class-variance-authority';
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

/** Where the logo stands: everywhere, or, where the bar shows the Workspace alone on a phone, from `md`. */
const logoSlot = cva('flex', {
  variants: {
    hidesLogoOnPhone: { true: 'max-md:hidden', false: '' },
  },
  defaultVariants: { hidesLogoOnPhone: false },
});

export type MemberNavbarProps = {
  /** Drawn before the logo, such as the button that opens a phone's menu. */
  leading?: React.ReactNode;
  /** Drawn right after the logo. */
  children?: React.ReactNode;
  /** Drawn at the right end, before the bell, such as a phone's "+". */
  actions?: React.ReactNode;
  /**
   * The bar on a phone shows the Workspace alone, as `children`, without the logo beside it: below
   * `md` the logo is not drawn.
   */
  hidesLogoOnPhone?: boolean;
  /**
   * The page has a sidebar that holds Settings and the avatar at its foot, beside the page or, on a
   * phone, in its menu drawer, so the navbar does not draw them.
   */
  isAccountInSidebar?: boolean;
};

/**
 * The navbar of every page a Member uses: the logo, leading Home, on the left; Settings and the
 * person's avatar on the right. The colour mode is chosen in Settings, so there is no switch
 * here. Register keeps `SiteNavbar`, because someone still registering has no Home to go to.
 * The bell is beside Settings, and only for somebody signed in: it asks the server what is
 * waiting for them, and there is nothing waiting for nobody.
 * This is where a session due a refresh gets one on a Member's pages.
 *
 * Home's pages pass the Workspace the person is in as `children`, drawn right after the logo, the
 * phone's menu button before it (`leading`) and its "+" by the bell (`actions`), and keep Settings
 * and the avatar in their sidebar (`isAccountInSidebar`).
 */
export async function MemberNavbar({
  leading,
  children,
  actions,
  hidesLogoOnPhone = false,
  isAccountInSidebar = false,
}: MemberNavbarProps = {}) {
  const [session, needsRefresh] = await Promise.all([
    readSession(),
    readSessionNeedsRefresh(),
  ]);
  const logo = (
    <span className={logoSlot({ hidesLogoOnPhone })}>
      <NavbarLogo href={session ? ROUTES.home : ROUTES.landing} />
    </span>
  );

  return (
    // Where a page's head hangs from the bar, the bar draws that head's ground instead of glass.
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 flex h-18 items-center justify-between gap-gap-nav px-inset-container',
        styles.glass,
        styles.curvesDown,
        styles.framed,
        styles.hangsOver,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        {children ? (
          <div className="flex min-w-0 items-center gap-1 sm:gap-4">
            {logo}
            {children}
          </div>
        ) : (
          logo
        )}
      </div>
      {needsRefresh && <SessionRefresher />}
      <div className="flex items-center gap-gap-nav">
        {session && (
          <>
            {actions}
            <NotificationBell />
            {!isAccountInSidebar && (
              <div className="flex items-center gap-gap-nav">
                <SettingsLink />
                <AccountAvatar
                  name={session.profile?.displayName ?? session.name}
                  email={session.email}
                  slug={session.profile?.slug ?? null}
                  photoUrl={session.photoUrl}
                />
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
