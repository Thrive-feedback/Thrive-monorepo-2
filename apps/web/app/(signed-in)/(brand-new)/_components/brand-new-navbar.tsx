import { XIcon } from 'lucide-react';
import { MemberNavbar } from '@/components/organisms/member-navbar';
import { ROUTES } from '@/lib/routes.constant';
import { readCurrentMembership } from '@/lib/session/session.service';
import { readMyWorkspaces } from '@/lib/workspace/my-workspaces.service';
import { WorkspaceSelector } from './workspace-selector';

/**
 * The new Home's navbar: the Member navbar, its logo leading to the new Home, with the Workspace
 * the person is in after it, "Thrive × Acme", from which they switch (brain `ADR-0049`).
 *
 * Their Workspaces are read only once the membership says someone is in one: for anybody else
 * there are none to read, and the page sends them where they belong.
 */
export async function BrandNewNavbar() {
  const membership = await readCurrentMembership();
  const workspaces = membership ? await readMyWorkspaces() : null;

  return (
    <MemberNavbar homeHref={ROUTES.brandNewHome}>
      {membership && workspaces && (
        <>
          <XIcon
            aria-hidden="true"
            className="size-4 shrink-0 translate-x-1 translate-y-0.5 text-fg-muted"
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
