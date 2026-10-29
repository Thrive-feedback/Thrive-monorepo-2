import { XIcon } from 'lucide-react';
import { NavbarLogo } from '@/components/molecules/navbar-logo';
import { AccountAvatar } from '@/components/organisms/account-avatar';
import styles from '@/components/organisms/glass.module.css';
import { NotificationBell } from '@/components/organisms/notification-bell';
import { SessionRefresher } from '@/components/organisms/session-refresher';
import { SettingsLink } from '@/components/organisms/settings-link';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import {
  readCurrentMembership,
  readSession,
  readSessionNeedsRefresh,
} from '@/lib/session/session.service';
import { readMyWorkspaces } from '@/lib/workspace/my-workspaces.service';
import { WorkspaceSelector } from './workspace-selector';

/**
 * The new Home's navbar, built beside `MemberNavbar` until the new Home replaces the old one: the
 * same bar, with the Workspace the person is in after the logo, "Thrive × Acme", from which they
 * switch (brain `ADR-0049`). Its logo leads to the new Home.
 */
export async function BrandNewNavbar() {
  const [session, needsRefresh, membership] = await Promise.all([
    readSession(),
    readSessionNeedsRefresh(),
    readCurrentMembership(),
  ]);
  const workspaces = membership ? await readMyWorkspaces() : null;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 flex h-18 items-center justify-between gap-gap-nav px-inset-container',
        styles.glass,
        styles.curvesDown,
        styles.framed,
      )}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <NavbarLogo href={session ? ROUTES.brandNewHome : ROUTES.landing} />
        {membership && workspaces && (
          <>
            <XIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-fg-muted"
            />
            <WorkspaceSelector
              current={membership.workspace}
              workspaces={workspaces}
            />
          </>
        )}
      </div>
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
