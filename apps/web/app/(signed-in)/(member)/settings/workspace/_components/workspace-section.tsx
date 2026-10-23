import { Suspense } from 'react';
import { Button } from '@/components/atoms/button';
import { ROLE_NAMES } from '@/lib/session/role-names.constant';
import type { MemberAccount } from '@/lib/session/session.service';
import {
  SettingRow,
  SettingValues,
  SettingValuesSkeleton,
} from '../../_components/setting-row';
import { IntegrationList, IntegrationListSkeleton } from './integration-list';
import {
  LeaveWorkspaceRow,
  LeaveWorkspaceRowSkeleton,
} from './leave-workspace-row';
import { WorkspaceSwitcherLoader } from './workspace-switcher-loader';

const WORKSPACE_NAME = 'Workspace name';
const YOUR_ROLE = 'Your Role';

/**
 * The Workspace this device is in: its name and the person's Role in it; Switch Workspace, to
 * open another of the person's or create one; the chat tools it posts into, which every Member
 * can see and only an Admin can change; and, last, the way to leave it. Who is in it lives in
 * Settings → Members.
 */
export function WorkspaceSection({ session }: { session: MemberAccount }) {
  return (
    <section className="flex flex-col">
      <SettingValues
        rows={[
          { label: WORKSPACE_NAME, value: session.membership.workspace.name },
          { label: YOUR_ROLE, value: ROLE_NAMES[session.membership.role] },
        ]}
      />
      <SwitchWorkspaceRow>
        <Suspense fallback={<SwitchWorkspaceButtonSkeleton />}>
          <WorkspaceSwitcherLoader membership={session.membership} />
        </Suspense>
      </SwitchWorkspaceRow>
      <Suspense fallback={<IntegrationListSkeleton />}>
        <IntegrationList membership={session.membership} />
      </Suspense>
      <Suspense fallback={<LeaveWorkspaceRowSkeleton />}>
        <LeaveWorkspaceRow
          membership={session.membership}
          ownEmail={session.email}
        />
      </Suspense>
    </section>
  );
}

/** `WorkspaceSection` while the session is read: every row's label in place, the rest in grey. */
export function WorkspaceSectionSkeleton() {
  return (
    <div className="flex flex-col">
      <SettingValuesSkeleton labels={[WORKSPACE_NAME, YOUR_ROLE]} />
      <SwitchWorkspaceRow>
        <SwitchWorkspaceButtonSkeleton />
      </SwitchWorkspaceRow>
      <IntegrationListSkeleton />
      <LeaveWorkspaceRowSkeleton />
    </div>
  );
}

function SwitchWorkspaceRow({ children }: { children: React.ReactNode }) {
  return (
    <SettingRow
      label="Switch Workspace"
      description="Open another of your Workspaces on this device, or create a new one."
    >
      {children}
    </SettingRow>
  );
}

/** The switcher's own button, unusable until the person's Workspaces are read. */
function SwitchWorkspaceButtonSkeleton() {
  return (
    <Button variant="secondary" size="sm" disabled>
      Switch Workspace
    </Button>
  );
}
