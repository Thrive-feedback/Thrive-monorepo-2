import { XIcon } from 'lucide-react';
import { MemberNavbar } from '@/components/organisms/member-navbar';
import { readCurrentMembership } from '@/lib/session/session.service';
import { readMyWorkspaces } from '@/lib/workspace/my-workspaces.service';
import { NavbarCompose } from './navbar-compose';
import { SidebarDrawerTrigger } from './sidebar-drawer';
import { WorkspaceSelector } from './workspace-selector';

/**
 * Home's navbar: the Member navbar, its logo leading Home, with the Workspace
 * the person is in after it, "Thrive × Acme", from which they switch (brain `ADR-0049`). Settings
 * and the person's avatar are at the foot of the sidebar instead. On a phone, where the sidebar is
 * not beside the page, a menu button before the logo opens it in a drawer, and "+" stands by the
 * bell; there the bar shows the Workspace's name alone, without the logo, and switching is left to
 * Settings.
 *
 * Their Workspaces are read only once the membership says someone is in one: for anybody else
 * there are none to read, and the page sends them where they belong.
 */
export async function Navbar() {
  const membership = await readCurrentMembership();
  const workspaces = membership ? await readMyWorkspaces() : null;

  return (
    <MemberNavbar
      hidesLogoOnPhone={Boolean(membership && workspaces)}
      isAccountInSidebar
      leading={membership && <SidebarDrawerTrigger />}
      actions={membership && <NavbarCompose />}
    >
      {membership && workspaces && (
        <>
          <XIcon
            aria-hidden="true"
            className="size-4 shrink-0 translate-x-1 translate-y-0.5 text-fg-muted max-md:hidden"
          />
          <WorkspaceSelector
            current={membership.workspace}
            workspaces={workspaces}
          />
        </>
      )}
    </MemberNavbar>
  );
}
