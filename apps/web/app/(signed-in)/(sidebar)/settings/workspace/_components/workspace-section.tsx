import { Suspense } from 'react';
import {
  SettingRow,
  SettingValues,
  SettingValuesSkeleton,
} from '@/app/(signed-in)/(sidebar)/settings/_components/setting-row';
import { SettingsCard } from '@/app/(signed-in)/(sidebar)/settings/_components/settings-card';
import { Button } from '@/components/atoms/button';
import type { MemberAccount } from '@/lib/session/session.service';
import { IntegrationList, IntegrationListSkeleton } from './integration-list';
import {
  LeaveWorkspaceRow,
  LeaveWorkspaceRowSkeleton,
} from './leave-workspace-row';
import { WorkspaceSwitcherLoader } from './workspace-switcher-loader';

const CONNECTIONS = 'Connections';
const CONNECTIONS_DESCRIPTION =
  'Chat tools where Thrive posts for the whole Workspace. Everyone can see them; only Admins can connect or disconnect one.';
const WORKSPACE_NAME = 'Workspace name';

export type WorkspaceSectionProps = {
  session: MemberAccount;
};

/**
 * The Workspace this device is in, in three cards: its name and Switch Workspace, to open another
 * of the person's or create one; then the chat tools it is connected to, which every Member can
 * see and only an Admin can change; and, apart at the end, the way to leave it. Who is in it, and
 * each person's Role, their own included, lives in Settings → Teammates.
 */
export function WorkspaceSection({ session }: WorkspaceSectionProps) {
  return (
    <>
      <SettingsCard>
        <SettingValues
          rows={[
            { label: WORKSPACE_NAME, value: session.membership.workspace.name },
          ]}
        />
        <SwitchWorkspaceRow>
          <Suspense fallback={<SwitchWorkspaceButtonSkeleton />}>
            <WorkspaceSwitcherLoader membership={session.membership} />
          </Suspense>
        </SwitchWorkspaceRow>
      </SettingsCard>
      <SettingsCard title={CONNECTIONS} description={CONNECTIONS_DESCRIPTION}>
        <Suspense fallback={<IntegrationListSkeleton />}>
          <IntegrationList membership={session.membership} />
        </Suspense>
      </SettingsCard>
      <SettingsCard>
        <Suspense fallback={<LeaveWorkspaceRowSkeleton />}>
          <LeaveWorkspaceRow
            membership={session.membership}
            ownEmail={session.email}
          />
        </Suspense>
      </SettingsCard>
    </>
  );
}

/** `WorkspaceSection` while the session is read: every card and row's label in place, the rest in grey. */
export function WorkspaceSectionSkeleton() {
  return (
    <>
      <SettingsCard>
        <SettingValuesSkeleton labels={[WORKSPACE_NAME]} />
        <SwitchWorkspaceRow>
          <SwitchWorkspaceButtonSkeleton />
        </SwitchWorkspaceRow>
      </SettingsCard>
      <SettingsCard title={CONNECTIONS} description={CONNECTIONS_DESCRIPTION}>
        <IntegrationListSkeleton />
      </SettingsCard>
      <SettingsCard>
        <LeaveWorkspaceRowSkeleton />
      </SettingsCard>
    </>
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
